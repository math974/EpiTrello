import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/models/activity-type.enum';

@Injectable()
export class CardsService {
  private readonly cardInclude = {
    list: true,
    assignees: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createCard(listId: string, title: string, userId: string) {
    // Validate listId is provided
    if (!listId || listId.trim() === '') {
      throw new NotFoundException('List ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
    }

    // Find the list with its board and workspace
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(list.board.workspaceId, userId);

    // Get the last position (highest position value) for cards in this list
    const lastCard = await this.prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });

    // Calculate the new position (last position + 1, or 0 if no cards exist)
    const newPosition = lastCard ? lastCard.position + 1 : 0;

    // Create the card with auto-calculated position
    const card = await this.prisma.card.create({
      data: {
        title,
        listId,
        position: newPosition,
      },
      include: this.cardInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: list.board.workspaceId,
        boardId: list.boardId,
        actorId: userId,
        type: ActivityType.CARD_CREATED,
        metadata: { title, cardId: card.id, listId },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return card;
  }

  async updateCard(
    cardId: string,
    userId: string,
    title?: string | null,
    description?: string | null
  ) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Prepare update data
    const updateData: { title?: string; description?: string | null } = {};

    if (title !== undefined) {
      // If title is provided, validate it's not empty
      if (title !== null && title.trim() === '') {
        throw new NotFoundException('Title cannot be empty');
      }
      // Only include title if it's not null (Prisma doesn't allow null for title)
      if (title !== null) {
        updateData.title = title;
      }
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // If no fields to update, return the card as is
    if (Object.keys(updateData).length === 0) {
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    }

    // Update the card
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: this.cardInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_UPDATED,
        metadata: { cardId, ...updateData },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedCard;
  }

  async archiveCard(cardId: string, archived: boolean, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Use a transaction to update archived status and reorganize positions if archiving
    if (archived && !card.archived) {
      // Archiving: store original position and reorganize positions of non-archived cards after this one
      await this.prisma.$transaction(async (tx) => {
        // Update the card archived status and store original position
        await tx.card.update({
          where: { id: cardId },
          data: {
            archived: true,
            archivedPosition: card.position, // Store original position
          },
        });

        // Reorganize positions: decrement positions of all non-archived cards after the archived one
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            archived: false,
            position: {
              gt: card.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      });

      // Log activity (non-blocking)
      this.activitiesService
        .logActivity({
          workspaceId: card.list.board.workspaceId,
          boardId: card.list.boardId,
          actorId: userId,
          type: ActivityType.CARD_ARCHIVED,
          metadata: { cardId, title: card.title },
        })
        .catch(() => {
          // Ignore logging errors
        });

      // Return the updated card
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    } else if (!archived && card.archived) {
      // Unarchiving: restore original position and reorganize other cards
      const originalPosition = card.archivedPosition ?? 0;

      await this.prisma.$transaction(async (tx) => {
        // First, increment positions of all non-archived cards at or after the original position
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            archived: false,
            position: {
              gte: originalPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });

        // Then restore the card to its original position
        await tx.card.update({
          where: { id: cardId },
          data: {
            archived: false,
            position: originalPosition,
            archivedPosition: null, // Clear archived position
          },
        });
      });

      // Return the updated card
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    } else {
      // No change in archived status, just return the card
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    }
  }

  async deleteCard(cardId: string, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Use a transaction to delete the card and reorganize positions
    await this.prisma.$transaction(async (tx) => {
      // Delete the card
      await tx.card.delete({
        where: { id: cardId },
      });

      // Reorganize positions: decrement positions of all cards after the deleted one in the same list
      await tx.card.updateMany({
        where: {
          listId: card.listId,
          position: {
            gt: card.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    });

    // Log activity before deletion (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_DELETED,
        metadata: { cardId, title: card.title },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return true;
  }

  async moveCard(cardId: string, toListId: string, toIndex: number, userId: string) {
    // Validate inputs
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    if (!toListId || toListId.trim() === '') {
      throw new NotFoundException('Target list ID is required');
    }

    if (toIndex < 0) {
      throw new NotFoundException('Target index must be non-negative');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Find the target list with its board and workspace
    const targetList = await this.prisma.list.findUnique({
      where: { id: toListId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!targetList) {
      throw new NotFoundException('Target list not found');
    }

    // Check if both lists belong to the same workspace
    if (card.list.board.workspaceId !== targetList.board.workspaceId) {
      throw new ForbiddenException('Cannot move card between different workspaces');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    const sameList = card.listId === toListId;
    const currentPosition = card.position;

    // Use a transaction to move the card and reorganize positions
    await this.prisma.$transaction(async (tx) => {
      if (sameList) {
        // Same list: reorganize positions within the same list
        // Get all non-archived cards in the list, ordered by position
        const allCardsInList = await tx.card.findMany({
          where: {
            listId: card.listId,
            archived: false,
          },
          orderBy: { position: 'asc' },
        });

        // Find current index of the card being moved
        const currentIndex = allCardsInList.findIndex((c) => c.id === cardId);
        if (currentIndex === toIndex) {
          // No move needed, card is already at the target index
          return;
        }

        // Remove the card from the array
        const cardsWithoutMoved = allCardsInList.filter((c) => c.id !== cardId);

        // Calculate new position based on toIndex
        let newPosition: number;
        if (toIndex === 0) {
          // Moving to the beginning
          newPosition = 0;
          // Increment all other positions
          await tx.card.updateMany({
            where: {
              listId: card.listId,
              archived: false,
              id: { not: cardId },
            },
            data: {
              position: { increment: 1 },
            },
          });
        } else if (toIndex >= cardsWithoutMoved.length) {
          // Moving to the end
          newPosition = cardsWithoutMoved.length;
        } else {
          // Moving to a position in the middle
          const targetCard = cardsWithoutMoved[toIndex];
          newPosition = targetCard.position;

          if (currentIndex < toIndex) {
            // Moving down: decrement positions between current and new
            await tx.card.updateMany({
              where: {
                listId: card.listId,
                archived: false,
                id: { not: cardId },
                position: {
                  gt: currentPosition,
                  lte: newPosition,
                },
              },
              data: {
                position: { decrement: 1 },
              },
            });
          } else {
            // Moving up: increment positions between new and current
            await tx.card.updateMany({
              where: {
                listId: card.listId,
                archived: false,
                id: { not: cardId },
                position: {
                  gte: newPosition,
                  lt: currentPosition,
                },
              },
              data: {
                position: { increment: 1 },
              },
            });
          }
        }

        // Update the card's position
        await tx.card.update({
          where: { id: cardId },
          data: {
            position: newPosition,
          },
        });
      } else {
        // Cross-list: move card to a different list
        // Get all non-archived cards in the target list, ordered by position
        const cardsInTargetList = await tx.card.findMany({
          where: {
            listId: toListId,
            archived: false,
          },
          orderBy: { position: 'asc' },
        });

        // Calculate new position in target list
        let newPosition: number;
        if (toIndex === 0) {
          // Moving to the beginning of target list
          newPosition = 0;
          // Increment all positions in target list
          await tx.card.updateMany({
            where: {
              listId: toListId,
              archived: false,
            },
            data: {
              position: { increment: 1 },
            },
          });
        } else if (toIndex >= cardsInTargetList.length) {
          // Moving to the end of target list
          newPosition = cardsInTargetList.length;
        } else {
          // Moving to a position in the middle of target list
          const targetCard = cardsInTargetList[toIndex];
          newPosition = targetCard.position;
          // Increment positions from target position onwards
          await tx.card.updateMany({
            where: {
              listId: toListId,
              archived: false,
              position: {
                gte: newPosition,
              },
            },
            data: {
              position: { increment: 1 },
            },
          });
        }

        // Decrement positions in source list (cards after the moved card)
        await tx.card.updateMany({
          where: {
            listId: card.listId,
            archived: false,
            position: {
              gt: currentPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // Update the card: change listId and position
        await tx.card.update({
          where: { id: cardId },
          data: {
            listId: toListId,
            position: newPosition,
          },
        });
      }
    });

    // Get the updated card
    const updatedCard = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_MOVED,
        metadata: {
          cardId,
          fromListId: card.listId,
          toListId,
          toIndex,
        },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedCard;
  }

  async addLabelToCard(cardId: string, labelId: string, userId: string) {
    // Validate inputs
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    if (!labelId || labelId.trim() === '') {
      throw new NotFoundException('Label ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Find the label with its workspace
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: {
        workspace: true,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if label belongs to the same workspace as the card
    if (label.workspaceId !== card.list.board.workspaceId) {
      throw new ForbiddenException('Label does not belong to the same workspace as the card');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Check if the label is already attached to the card (prevent duplicates)
    const existingRelation = await this.prisma.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    if (existingRelation) {
      // Label is already attached, return the card without error
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    }

    // Create the relation
    await this.prisma.cardLabel.create({
      data: {
        cardId,
        labelId,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_LABEL_ADDED,
        metadata: { cardId, labelId, labelName: label.name },
      })
      .catch(() => {
        // Ignore logging errors
      });

    // Return the updated card
    return this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: true,
      },
    });
  }

  async removeLabelFromCard(cardId: string, labelId: string, userId: string) {
    // Validate inputs
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    if (!labelId || labelId.trim() === '') {
      throw new NotFoundException('Label ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Find the label with its workspace
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: {
        workspace: true,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if label belongs to the same workspace as the card
    if (label.workspaceId !== card.list.board.workspaceId) {
      throw new ForbiddenException('Label does not belong to the same workspace as the card');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Check if the relation exists
    const existingRelation = await this.prisma.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    if (!existingRelation) {
      // Relation doesn't exist, return the card without error (idempotent)
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    }

    // Delete the relation
    await this.prisma.cardLabel.delete({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_LABEL_REMOVED,
        metadata: { cardId, labelId, labelName: label.name },
      })
      .catch(() => {
        // Ignore logging errors
      });

    // Return the updated card
    return this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: true,
      },
    });
  }

  async setCardDueDate(cardId: string, dueDate: Date, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Update the card with the due date
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        dueDate,
      },
      include: this.cardInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_DUE_DATE_SET,
        metadata: { cardId, dueDate: dueDate.toISOString() },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedCard;
  }

  async clearCardDueDate(cardId: string, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Update the card to clear the due date
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        dueDate: null,
      },
      include: this.cardInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_DUE_DATE_CLEARED,
        metadata: { cardId },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedCard;
  }

  async setCardDone(cardId: string, done: boolean, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Update the card with the done flag
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        done,
      },
      include: this.cardInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.CARD_DONE_SET,
        metadata: { cardId, done },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedCard;
  }

  async assignUserToCard(cardId: string, userId: string, actorId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate userId is provided
    if (!userId || userId.trim() === '') {
      throw new NotFoundException('User ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if actor is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      actorId
    );

    // Check if the user to assign is a member of the workspace
    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: card.list.board.workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('User is not a member of the workspace');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.cardAssignee.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (existingAssignment) {
      // Already assigned, return success (idempotent)
      return true;
    }

    // Create the assignment
    await this.prisma.cardAssignee.create({
      data: {
        cardId,
        userId,
      },
    });

    // Log activity
    await this.activitiesService.logActivity({
      workspaceId: card.list.board.workspaceId,
      boardId: card.list.boardId,
      actorId,
      type: ActivityType.CARD_ASSIGNEE_ADDED,
      metadata: {
        cardId,
        userId,
      },
    }).catch(() => {
      // Ignore activity logging errors
    });

    return true;
  }

  async unassignUserFromCard(cardId: string, userId: string, actorId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate userId is provided
    if (!userId || userId.trim() === '') {
      throw new NotFoundException('User ID is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if actor is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      actorId
    );

    // Check if assignment exists
    const assignment = await this.prisma.cardAssignee.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('User is not assigned to this card');
    }

    // Delete the assignment
    await this.prisma.cardAssignee.delete({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    // Log activity
    await this.activitiesService.logActivity({
      workspaceId: card.list.board.workspaceId,
      boardId: card.list.boardId,
      actorId,
      type: ActivityType.CARD_ASSIGNEE_REMOVED,
      metadata: {
        cardId,
        userId,
      },
    }).catch(() => {
      // Ignore activity logging errors
    });

    return true;
  }

  async setCardAssignees(cardId: string, userIds: string[], actorId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate userIds is provided (can be empty array)
    if (!Array.isArray(userIds)) {
      throw new NotFoundException('User IDs must be an array');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if actor is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      actorId
    );

    // Validate all users are workspace members
    if (userIds.length > 0) {
      const workspaceMembers = await this.prisma.workspaceMember.findMany({
        where: {
          workspaceId: card.list.board.workspaceId,
          userId: {
            in: userIds,
          },
        },
        select: {
          userId: true,
        },
      });

      const memberIds = new Set(workspaceMembers.map((m) => m.userId));
      for (const userId of userIds) {
        if (!memberIds.has(userId)) {
          throw new ForbiddenException(
            `User ${userId} is not a member of the workspace`
          );
        }
      }
    }

    // Use a transaction to replace all assignments
    await this.prisma.$transaction(async (tx) => {
      // Delete all existing assignments
      await tx.cardAssignee.deleteMany({
        where: { cardId },
      });

      // Create new assignments
      if (userIds.length > 0) {
        await tx.cardAssignee.createMany({
          data: userIds.map((userId) => ({
            cardId,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Log activity
    await this.activitiesService.logActivity({
      workspaceId: card.list.board.workspaceId,
      boardId: card.list.boardId,
      actorId,
      type: ActivityType.CARD_ASSIGNEES_SET,
      metadata: {
        cardId,
        userIds,
      },
    }).catch(() => {
      // Ignore activity logging errors
    });

    return true;
  }
}

