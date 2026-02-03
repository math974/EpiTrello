import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ListsService } from './lists.service';

describe('ListsService', () => {
  const prisma = {
    board: {
      findUnique: jest.fn(),
    },
    list: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const service = new ListsService(prisma, workspacesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createList', () => {
    it('creates a list with position 0 when board has no lists', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const newList = {
        id: 'list-1',
        title: 'To Do',
        position: 0,
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: boardWithWorkspace,
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findFirst = jest.fn().mockResolvedValue(null);
      prisma.list.create = jest.fn().mockResolvedValue(newList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createList('board-1', 'To Do', 'user-1');

      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.list.findFirst).toHaveBeenCalledWith({
        where: { boardId: 'board-1' },
        orderBy: { position: 'desc' },
      });
      expect(prisma.list.create).toHaveBeenCalledWith({
        data: {
          title: 'To Do',
          boardId: 'board-1',
          position: 0,
        },
        include: {
          board: true,
        },
      });
      expect(result).toBe(newList);
      expect(result.position).toBe(0);
    });

    it('creates a list with position auto-calculated when board has existing lists', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const lastList = {
        id: 'list-1',
        title: 'Existing List',
        position: 2,
        boardId: 'board-1',
      };
      const newList = {
        id: 'list-2',
        title: 'New List',
        position: 3,
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: boardWithWorkspace,
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findFirst = jest.fn().mockResolvedValue(lastList);
      prisma.list.create = jest.fn().mockResolvedValue(newList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createList('board-1', 'New List', 'user-1');

      expect(prisma.list.findFirst).toHaveBeenCalledWith({
        where: { boardId: 'board-1' },
        orderBy: { position: 'desc' },
      });
      expect(prisma.list.create).toHaveBeenCalledWith({
        data: {
          title: 'New List',
          boardId: 'board-1',
          position: 3,
        },
        include: {
          board: true,
        },
      });
      expect(result).toBe(newList);
      expect(result.position).toBe(3);
    });

    it('throws NotFoundException when boardId is empty', async () => {
      await expect(service.createList('', 'To Do', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when boardId is whitespace only', async () => {
      await expect(service.createList('   ', 'To Do', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.createList('board-1', '', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is whitespace only', async () => {
      await expect(service.createList('board-1', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when board does not exist', async () => {
      prisma.board.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createList('board-1', 'To Do', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.createList('board-1', 'To Do', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.list.create).not.toHaveBeenCalled();
    });
  });
});

