import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/models/activity-type.enum';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createBoard(workspaceId: string, title: string, userId: string) {
    // Validate workspaceId is provided
    if (!workspaceId || workspaceId.trim() === '') {
      throw new NotFoundException('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is a member of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    // Create board with owner = creator (userId)
    const board = await this.prisma.board.create({
      data: {
        title,
        workspaceId,
        ownerId: userId, // board owner = creator
      },
      include: {
        owner: true,
        workspace: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        boardId: board.id,
        actorId: userId,
        type: ActivityType.BOARD_CREATED,
        metadata: { title },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return board;
  }

  async workspaceBoards(workspaceId: string, userId: string) {
    // Validate workspaceId is provided
    if (!workspaceId || workspaceId.trim() === '') {
      throw new NotFoundException('Workspace ID is required');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(workspaceId, userId);

    // Return all boards for this workspace
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        owner: true,
        workspace: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async board(boardId: string, userId: string) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
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

    // Return board with lists and cards (include assignees on each card)
    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: true,
        workspace: { include: { labels: true } },
        lists: {
          include: {
            cards: {
              orderBy: {
                position: 'asc',
              },
              include: {
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
                comments: {
                  orderBy: { createdAt: 'asc' },
                  include: {
                    author: {
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
                labels: {
                  include: { label: true },
                },
                attachments: {
                  include: {
                    uploader: {
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
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async updateBoard(
    boardId: string,
    title: string,
    userId: string,
    description?: string | null,
    background?: string
  ) {
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

    // Prepare update data
    const updateData: { title: string; description?: string | null; background?: string } = {
      title,
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    if (background !== undefined) {
      updateData.background = background;
    }

    // Update the board
    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: updateData,
      include: {
        owner: true,
        workspace: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: board.workspaceId,
        boardId,
        actorId: userId,
        type: ActivityType.BOARD_UPDATED,
        metadata: updateData,
      })
      .catch(() => {
        // Ignore logging errors
      });

    return updatedBoard;
  }

  async deleteBoard(boardId: string, userId: string) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
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

    // Check if user is the board creator (ownerId)
    const isBoardCreator = board.ownerId === userId;

    // Check if user is the workspace owner
    const isWorkspaceOwner = board.workspace.ownerId === userId;

    // Allow deletion if user is either the board creator or workspace owner
    if (!isBoardCreator && !isWorkspaceOwner) {
      throw new ForbiddenException(
        'Only the board creator or workspace owner can delete this board'
      );
    }

    // Delete the board (lists and cards will be deleted in cascade due to onDelete: Cascade)
    // Note: We don't log board deletion as the activity would be deleted in cascade
    await this.prisma.board.delete({
      where: { id: boardId },
    });

    return true;
  }
}

