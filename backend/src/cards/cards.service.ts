import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
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
    return this.prisma.card.create({
      data: {
        title,
        listId,
        position: newPosition,
      },
      include: {
        list: true,
      },
    });
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
        include: {
          list: true,
        },
      });
    }

    // Update the card
    return this.prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        list: true,
      },
    });
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

      // Return the updated card
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: {
          list: true,
        },
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
        include: {
          list: true,
        },
      });
    } else {
      // No change in archived status, just return the card
      return this.prisma.card.findUnique({
        where: { id: cardId },
        include: {
          list: true,
        },
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

    // Return the updated card
    return this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: true,
      },
    });
  }
}

