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
}

