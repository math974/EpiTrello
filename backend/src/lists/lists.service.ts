import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async createList(boardId: string, title: string, userId: string) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
    }

    // Find the board with its workspace
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(board.workspaceId, userId);

    // Get the last position (highest position value) for lists in this board
    const lastList = await this.prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    // Calculate the new position (last position + 1, or 0 if no lists exist)
    const newPosition = lastList ? lastList.position + 1 : 0;

    // Create the list with auto-calculated position
    return this.prisma.list.create({
      data: {
        title,
        boardId,
        position: newPosition,
      },
      include: {
        board: true,
      },
    });
  }

  async updateList(listId: string, title: string, userId: string) {
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

    // Update the list
    return this.prisma.list.update({
      where: { id: listId },
      data: {
        title,
      },
      include: {
        board: true,
      },
    });
  }

  async archiveList(listId: string, archived: boolean, userId: string) {
    // Validate listId is provided
    if (!listId || listId.trim() === '') {
      throw new NotFoundException('List ID is required');
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

    // Use a transaction to update archived status and reorganize positions if archiving
    if (archived && !list.archived) {
      // Archiving: store original position and reorganize positions of non-archived lists after this one
      await this.prisma.$transaction(async (tx) => {
        // Update the list archived status and store original position
        await tx.list.update({
          where: { id: listId },
          data: {
            archived: true,
            archivedPosition: list.position, // Store original position
          },
        });

        // Reorganize positions: decrement positions of all non-archived lists after the archived one
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
            archived: false,
            position: {
              gt: list.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      });

      // Return the updated list
      return this.prisma.list.findUnique({
        where: { id: listId },
        include: {
          board: true,
        },
      });
    } else if (!archived && list.archived) {
      // Unarchiving: restore original position and reorganize other lists
      const originalPosition = list.archivedPosition ?? 0;

      await this.prisma.$transaction(async (tx) => {
        // First, increment positions of all non-archived lists at or after the original position
        await tx.list.updateMany({
          where: {
            boardId: list.boardId,
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

        // Then restore the list to its original position
        await tx.list.update({
          where: { id: listId },
          data: {
            archived: false,
            position: originalPosition,
            archivedPosition: null, // Clear archived position
          },
        });
      });

      // Return the updated list
      return this.prisma.list.findUnique({
        where: { id: listId },
        include: {
          board: true,
        },
      });
    } else {
      // No change in archived status, just return the list
      return this.prisma.list.findUnique({
        where: { id: listId },
        include: {
          board: true,
        },
      });
    }
  }

  async deleteList(listId: string, userId: string) {
    // Validate listId is provided
    if (!listId || listId.trim() === '') {
      throw new NotFoundException('List ID is required');
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

    // Use a transaction to delete the list and reorganize positions
    await this.prisma.$transaction(async (tx) => {
      // Delete the list (cards will be deleted in cascade due to onDelete: Cascade)
      await tx.list.delete({
        where: { id: listId },
      });

      // Reorganize positions: decrement positions of all lists after the deleted one
      await tx.list.updateMany({
        where: {
          boardId: list.boardId,
          position: {
            gt: list.position,
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

  async reorderLists(boardId: string, orderedListIds: string[], userId: string) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
    }

    // Validate orderedListIds is provided and not empty
    if (!orderedListIds || orderedListIds.length === 0) {
      throw new NotFoundException('Ordered list IDs are required');
    }

    // Find the board with its workspace
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(board.workspaceId, userId);

    // Fetch all non-archived lists for this board to validate they belong to the board
    const boardLists = await this.prisma.list.findMany({
      where: {
        boardId,
        archived: false, // Only include non-archived lists
      },
      select: { id: true },
    });

    const boardListIds = new Set(boardLists.map((list) => list.id));

    // Validate that all provided list IDs belong to this board and are not archived
    for (const listId of orderedListIds) {
      if (!boardListIds.has(listId)) {
        throw new NotFoundException(
          `List with ID ${listId} does not belong to board ${boardId} or is archived`
        );
      }
    }

    // Validate that all non-archived board lists are included in the ordered list
    if (orderedListIds.length !== boardLists.length) {
      throw new NotFoundException(
        'All non-archived lists from the board must be included in the reorder operation'
      );
    }

    // Use a transaction to update all positions atomically
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedListIds.map((listId, index) =>
          tx.list.update({
            where: { id: listId },
            data: { position: index },
          })
        )
      );
    });

    return true;
  }
}

