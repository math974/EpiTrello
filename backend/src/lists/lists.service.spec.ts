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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const activitiesService = {
    logActivity: jest.fn().mockResolvedValue(undefined),
  } as unknown as any;
  const service = new ListsService(prisma, workspacesService, activitiesService);

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

  describe('updateList', () => {
    it('updates a list when user is a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'Old Title',
        position: 0,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      const updatedList = {
        id: 'list-1',
        title: 'New Title',
        position: 0,
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: listWithBoard.board,
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      prisma.list.update = jest.fn().mockResolvedValue(updatedList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateList('list-1', 'New Title', 'user-1');

      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.list.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: {
          title: 'New Title',
        },
        include: {
          board: true,
        },
      });
      expect(result).toBe(updatedList);
      expect(result.title).toBe('New Title');
    });

    it('throws NotFoundException when listId is empty', async () => {
      await expect(service.updateList('', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when listId is whitespace only', async () => {
      await expect(service.updateList('   ', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.updateList('list-1', '', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is whitespace only', async () => {
      await expect(service.updateList('list-1', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when list does not exist', async () => {
      prisma.list.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateList('list-1', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'Old Title',
        position: 0,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.updateList('list-1', 'New Title', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.list.update).not.toHaveBeenCalled();
    });
  });

  describe('archiveList', () => {
    it('archives a list and reorganizes positions when user is a workspace member and archived is true', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 1,
        archived: false,
        archivedPosition: null,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      const archivedList = {
        id: 'list-1',
        title: 'My List',
        position: 1,
        archived: true,
        archivedPosition: 1, // Original position stored
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: listWithBoard.board,
      };
      prisma.list.findUnique = jest
        .fn()
        .mockResolvedValueOnce(listWithBoard)
        .mockResolvedValueOnce(archivedList);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            update: jest.fn().mockResolvedValue(archivedList),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveList('list-1', true, 'user-1');

      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(archivedList);
      expect(result?.archived).toBe(true);
    });

    it('unarchives a list and restores it to its original position when user is a workspace member and archived is false', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: true,
        archivedPosition: 1, // Original position was 1
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      const unarchivedList = {
        id: 'list-1',
        title: 'My List',
        position: 1,
        archived: false,
        archivedPosition: null,
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: listWithBoard.board,
      };
      prisma.list.findUnique = jest
        .fn()
        .mockResolvedValueOnce(listWithBoard)
        .mockResolvedValueOnce(unarchivedList);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue(unarchivedList),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveList('list-1', false, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(unarchivedList);
      expect(result?.archived).toBe(false);
      expect(result?.position).toBe(1); // Restored to original position
    });

    it('unarchives a list and restores it to position 0 when archivedPosition is null', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: true,
        archivedPosition: null, // No original position stored, default to 0
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      const unarchivedList = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: false,
        archivedPosition: null,
        boardId: 'board-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        board: listWithBoard.board,
      };
      prisma.list.findUnique = jest
        .fn()
        .mockResolvedValueOnce(listWithBoard)
        .mockResolvedValueOnce(unarchivedList);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            update: jest.fn().mockResolvedValue(unarchivedList),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveList('list-1', false, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(unarchivedList);
      expect(result?.archived).toBe(false);
      expect(result?.position).toBe(0); // Restored to position 0 when archivedPosition is null
    });

    it('throws NotFoundException when listId is empty', async () => {
      await expect(service.archiveList('', true, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when listId is whitespace only', async () => {
      await expect(service.archiveList('   ', true, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when list does not exist', async () => {
      prisma.list.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.archiveList('list-1', true, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: false,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.archiveList('list-1', true, 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.list.update).not.toHaveBeenCalled();
    });

    it('does nothing when list is already archived and archived is true', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: true,
        archivedPosition: 0,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveList('list-1', true, 'user-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.list.findFirst).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
      expect(result).toBe(listWithBoard);
    });

    it('does nothing when list is already unarchived and archived is false', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: false,
        archivedPosition: null,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveList('list-1', false, 'user-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.list.findFirst).not.toHaveBeenCalled();
      expect(prisma.list.update).not.toHaveBeenCalled();
      expect(result).toBe(listWithBoard);
    });
  });

  describe('deleteList', () => {
    it('deletes a list and reorganizes positions when user is a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 1,
        archived: false,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            delete: jest.fn().mockResolvedValue(listWithBoard),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.deleteList('list-1', 'user-1');

      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('deletes a list at the end without reorganizing when user is a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 2,
        archived: false,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            delete: jest.fn().mockResolvedValue(listWithBoard),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.deleteList('list-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('throws NotFoundException when listId is empty', async () => {
      await expect(service.deleteList('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when listId is whitespace only', async () => {
      await expect(service.deleteList('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when list does not exist', async () => {
      prisma.list.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteList('list-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const listWithBoard = {
        id: 'list-1',
        title: 'My List',
        position: 0,
        archived: false,
        boardId: 'board-1',
        board: {
          id: 'board-1',
          title: 'My Board',
          workspaceId: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.deleteList('list-1', 'user-2')).rejects.toThrow(ForbiddenException);
      expect(prisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: {
          board: {
            include: {
              workspace: true,
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('reorderLists', () => {
    it('reorders lists when user is a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardLists = [
        { id: 'list-1' },
        { id: 'list-2' },
        { id: 'list-3' },
      ];
      const orderedListIds = ['list-3', 'list-1', 'list-2'];

      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findMany = jest.fn().mockResolvedValue(boardLists);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          list: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.reorderLists('board-1', orderedListIds, 'user-1');

      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(prisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId: 'board-1', archived: false },
        select: { id: true },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('throws NotFoundException when boardId is empty', async () => {
      await expect(service.reorderLists('', ['list-1'], 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when orderedListIds is empty', async () => {
      await expect(service.reorderLists('board-1', [], 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when board does not exist', async () => {
      prisma.board.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.reorderLists('board-1', ['list-1'], 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.reorderLists('board-1', ['list-1'], 'user-2')).rejects.toThrow(
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
      expect(prisma.list.findMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a list does not belong to the board', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardLists = [{ id: 'list-1' }, { id: 'list-2' }];
      const orderedListIds = ['list-1', 'list-3']; // list-3 doesn't belong to board-1

      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findMany = jest.fn().mockResolvedValue(boardLists);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.reorderLists('board-1', orderedListIds, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId: 'board-1', archived: false },
        select: { id: true },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when not all board lists are included', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardLists = [{ id: 'list-1' }, { id: 'list-2' }, { id: 'list-3' }];
      const orderedListIds = ['list-1', 'list-2']; // Missing list-3

      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findMany = jest.fn().mockResolvedValue(boardLists);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.reorderLists('board-1', orderedListIds, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId: 'board-1', archived: false },
        select: { id: true },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when trying to reorder with an archived list', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardLists = [
        { id: 'list-1' },
        { id: 'list-2' },
      ]; // list-3 is archived, so not included
      const orderedListIds = ['list-1', 'list-2', 'list-3']; // list-3 is archived

      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.list.findMany = jest.fn().mockResolvedValue(boardLists);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.reorderLists('board-1', orderedListIds, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId: 'board-1', archived: false },
        select: { id: true },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});

