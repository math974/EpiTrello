import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ChecklistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async createChecklist(cardId: string, title: string, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
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

    // Get the last position (highest position value) for checklists in this card
    const lastChecklist = await this.prisma.checklist.findFirst({
      where: { cardId },
      orderBy: { position: 'desc' },
    });

    // Calculate the new position (last position + 1, or 0 if no checklists exist)
    const newPosition = lastChecklist ? lastChecklist.position + 1 : 0;

    // Create the checklist with auto-calculated position
    return this.prisma.checklist.create({
      data: {
        title: title.trim(),
        cardId,
        position: newPosition,
      },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async updateChecklist(checklistId: string, title: string, userId: string) {
    // Validate checklistId is provided
    if (!checklistId || checklistId.trim() === '') {
      throw new NotFoundException('Checklist ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
    }

    // Find the checklist with its card, list, board and workspace
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        card: {
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
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      checklist.card.list.board.workspaceId,
      userId
    );

    // Update the checklist
    return this.prisma.checklist.update({
      where: { id: checklistId },
      data: {
        title: title.trim(),
      },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async deleteChecklist(checklistId: string, userId: string) {
    // Validate checklistId is provided
    if (!checklistId || checklistId.trim() === '') {
      throw new NotFoundException('Checklist ID is required');
    }

    // Find the checklist with its card, list, board and workspace
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        card: {
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
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      checklist.card.list.board.workspaceId,
      userId
    );

    // Use a transaction to delete the checklist and reorganize positions
    await this.prisma.$transaction(async (tx) => {
      // Delete the checklist (items will be deleted in cascade due to onDelete: Cascade)
      await tx.checklist.delete({
        where: { id: checklistId },
      });

      // Reorganize positions: decrement positions of all checklists after the deleted one
      await tx.checklist.updateMany({
        where: {
          cardId: checklist.cardId,
          position: {
            gt: checklist.position,
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

  async reorderChecklists(cardId: string, orderedChecklistIds: string[], userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate orderedChecklistIds is provided and not empty
    if (!orderedChecklistIds || orderedChecklistIds.length === 0) {
      throw new NotFoundException('Ordered checklist IDs are required');
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

    // Fetch all checklists for this card to validate they belong to the card
    const cardChecklists = await this.prisma.checklist.findMany({
      where: {
        cardId,
      },
      select: { id: true },
    });

    const cardChecklistIds = new Set(cardChecklists.map((checklist) => checklist.id));

    // Validate that all provided checklist IDs belong to this card
    for (const checklistId of orderedChecklistIds) {
      if (!cardChecklistIds.has(checklistId)) {
        throw new NotFoundException(
          `Checklist with ID ${checklistId} does not belong to card ${cardId}`
        );
      }
    }

    // Validate that all card checklists are included in the ordered list
    if (orderedChecklistIds.length !== cardChecklists.length) {
      throw new NotFoundException(
        'All checklists from the card must be included in the reorder operation'
      );
    }

    // Use a transaction to update all positions atomically
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedChecklistIds.map((checklistId, index) =>
          tx.checklist.update({
            where: { id: checklistId },
            data: { position: index },
          })
        )
      );
    });

    return true;
  }

  async createChecklistItem(checklistId: string, content: string, userId: string) {
    // Validate checklistId is provided
    if (!checklistId || checklistId.trim() === '') {
      throw new NotFoundException('Checklist ID is required');
    }

    // Validate content is provided
    if (!content || content.trim() === '') {
      throw new NotFoundException('Content is required');
    }

    // Find the checklist with its card, list, board and workspace
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        card: {
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
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      checklist.card.list.board.workspaceId,
      userId
    );

    // Get the last position (highest position value) for items in this checklist
    const lastItem = await this.prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { position: 'desc' },
    });

    // Calculate the new position (last position + 1, or 0 if no items exist)
    const newPosition = lastItem ? lastItem.position + 1 : 0;

    // Create the checklist item with auto-calculated position
    return this.prisma.checklistItem.create({
      data: {
        content: content.trim(),
        checklistId,
        position: newPosition,
      },
    });
  }

  async updateChecklistItem(
    itemId: string,
    userId: string,
    content?: string | null,
    checked?: boolean | null
  ) {
    // Validate itemId is provided
    if (!itemId || itemId.trim() === '') {
      throw new NotFoundException('Checklist item ID is required');
    }

    // Find the checklist item with its checklist, card, list, board and workspace
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            card: {
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
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      item.checklist.card.list.board.workspaceId,
      userId
    );

    // Prepare update data
    const updateData: { content?: string; checked?: boolean } = {};

    if (content !== undefined) {
      // If content is provided, validate it's not empty
      if (content !== null && content.trim() === '') {
        throw new NotFoundException('Content cannot be empty');
      }
      // Only include content if it's not null
      if (content !== null) {
        updateData.content = content.trim();
      }
    }

    if (checked !== undefined && checked !== null) {
      updateData.checked = checked;
    }

    // If no fields to update, return the item as is
    if (Object.keys(updateData).length === 0) {
      return this.prisma.checklistItem.findUnique({
        where: { id: itemId },
      });
    }

    // Update the checklist item
    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData,
    });
  }

  async deleteChecklistItem(itemId: string, userId: string) {
    // Validate itemId is provided
    if (!itemId || itemId.trim() === '') {
      throw new NotFoundException('Checklist item ID is required');
    }

    // Find the checklist item with its checklist, card, list, board and workspace
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            card: {
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
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      item.checklist.card.list.board.workspaceId,
      userId
    );

    // Use a transaction to delete the item and reorganize positions
    await this.prisma.$transaction(async (tx) => {
      // Delete the checklist item
      await tx.checklistItem.delete({
        where: { id: itemId },
      });

      // Reorganize positions: decrement positions of all items after the deleted one
      await tx.checklistItem.updateMany({
        where: {
          checklistId: item.checklistId,
          position: {
            gt: item.position,
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

  async reorderChecklistItems(
    checklistId: string,
    orderedItemIds: string[],
    userId: string
  ) {
    // Validate checklistId is provided
    if (!checklistId || checklistId.trim() === '') {
      throw new NotFoundException('Checklist ID is required');
    }

    // Validate orderedItemIds is provided and not empty
    if (!orderedItemIds || orderedItemIds.length === 0) {
      throw new NotFoundException('Ordered item IDs are required');
    }

    // Find the checklist with its card, list, board and workspace
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        card: {
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
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      checklist.card.list.board.workspaceId,
      userId
    );

    // Fetch all items for this checklist to validate they belong to the checklist
    const checklistItems = await this.prisma.checklistItem.findMany({
      where: {
        checklistId,
      },
      select: { id: true },
    });

    const checklistItemIds = new Set(checklistItems.map((item) => item.id));

    // Validate that all provided item IDs belong to this checklist
    for (const itemId of orderedItemIds) {
      if (!checklistItemIds.has(itemId)) {
        throw new NotFoundException(
          `Checklist item with ID ${itemId} does not belong to checklist ${checklistId}`
        );
      }
    }

    // Validate that all checklist items are included in the ordered list
    if (orderedItemIds.length !== checklistItems.length) {
      throw new NotFoundException(
        'All items from the checklist must be included in the reorder operation'
      );
    }

    // Use a transaction to update all positions atomically
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedItemIds.map((itemId, index) =>
          tx.checklistItem.update({
            where: { id: itemId },
            data: { position: index },
          })
        )
      );
    });

    return true;
  }
}


