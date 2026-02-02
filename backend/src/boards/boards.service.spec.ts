import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  const prisma = {
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    board: {
      create: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new BoardsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBoard', () => {
    it('creates a board when user is a workspace member', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const membership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'MEMBER' as const,
      };
      const board = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);
      prisma.board.create = jest.fn().mockResolvedValue(board);

      const result = await service.createBoard('workspace-1', 'My Board', 'user-1');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.board.create).toHaveBeenCalledWith({
        data: {
          title: 'My Board',
          workspaceId: 'workspace-1',
          ownerId: 'user-1', // board owner = creator
        },
        include: {
          owner: true,
          workspace: true,
        },
      });
      expect(result).toBe(board);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createBoard('workspace-1', 'My Board', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.board.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createBoard('workspace-1', 'My Board', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.board.create).not.toHaveBeenCalled();
    });

    it('creates board with ownerId equal to creator userId', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      const membership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'MEMBER' as const,
      };
      const board = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1', // creator is the owner
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);
      prisma.board.create = jest.fn().mockResolvedValue(board);

      const result = await service.createBoard('workspace-1', 'My Board', 'user-1');

      expect(prisma.board.create).toHaveBeenCalledWith({
        data: {
          title: 'My Board',
          workspaceId: 'workspace-1',
          ownerId: 'user-1', // board owner = creator
        },
        include: {
          owner: true,
          workspace: true,
        },
      });
      expect(result.ownerId).toBe('user-1'); // Verify owner is creator
    });
  });
});

