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
}

