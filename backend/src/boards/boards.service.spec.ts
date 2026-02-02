import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const service = new BoardsService(prisma, workspacesService);

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

    it('throws NotFoundException when workspaceId is empty', async () => {
      await expect(service.createBoard('', 'My Board', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspace.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.board.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when workspaceId is whitespace only', async () => {
      await expect(service.createBoard('   ', 'My Board', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspace.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.board.create).not.toHaveBeenCalled();
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

  describe('workspaceBoards', () => {
    it('returns boards for workspace when user is a member', async () => {
      const boards = [
        {
          id: 'board-1',
          title: 'Board 1',
          description: null,
          background: '#0079bf',
          ownerId: 'user-1',
          workspaceId: 'workspace-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
        {
          id: 'board-2',
          title: 'Board 2',
          description: null,
          background: '#0079bf',
          ownerId: 'user-2',
          workspaceId: 'workspace-1',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          owner: { id: 'user-2', username: 'user2', email: 'user2@example.com' },
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      ];
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });
      prisma.board.findMany = jest.fn().mockResolvedValue(boards);

      const result = await service.workspaceBoards('workspace-1', 'user-1');

      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.board.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1' },
        include: {
          owner: true,
          workspace: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toBe(boards);
    });

    it('returns empty array when workspace has no boards', async () => {
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });
      prisma.board.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.workspaceBoards('workspace-1', 'user-1');

      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.board.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1' },
        include: {
          owner: true,
          workspace: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual([]);
    });

    it('throws NotFoundException when workspaceId is empty', async () => {
      await expect(service.workspaceBoards('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.findMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when workspaceId is whitespace only', async () => {
      await expect(service.workspaceBoards('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.findMany).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.workspaceBoards('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.board.findMany).not.toHaveBeenCalled();
    });

    it('returns boards ordered by createdAt descending', async () => {
      const boards = [
        {
          id: 'board-2',
          title: 'Board 2',
          description: null,
          background: '#0079bf',
          ownerId: 'user-2',
          workspaceId: 'workspace-1',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          owner: { id: 'user-2', username: 'user2', email: 'user2@example.com' },
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
        {
          id: 'board-1',
          title: 'Board 1',
          description: null,
          background: '#0079bf',
          ownerId: 'user-1',
          workspaceId: 'workspace-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
          workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        },
      ];
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });
      prisma.board.findMany = jest.fn().mockResolvedValue(boards);

      const result = await service.workspaceBoards('workspace-1', 'user-1');

      expect(prisma.board.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1' },
        include: {
          owner: true,
          workspace: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toBe(boards);
    });
  });

  describe('board', () => {
    it('returns board with lists and cards when user is a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardWithLists = {
        ...boardWithWorkspace,
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace: boardWithWorkspace.workspace,
        lists: [
          {
            id: 'list-1',
            title: 'To Do',
            position: 0,
            boardId: 'board-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            cards: [
              {
                id: 'card-1',
                title: 'Card 1',
                description: null,
                position: 0,
                listId: 'list-1',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'card-2',
                title: 'Card 2',
                description: 'Description',
                position: 1,
                listId: 'list-1',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
          {
            id: 'list-2',
            title: 'Done',
            position: 1,
            boardId: 'board-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            cards: [],
          },
        ],
      };
      prisma.board.findUnique = jest
        .fn()
        .mockResolvedValueOnce(boardWithWorkspace)
        .mockResolvedValueOnce(boardWithLists);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.board('board-1', 'user-1');

      expect(prisma.board.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.board.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(prisma.board.findUnique).toHaveBeenNthCalledWith(2, {
        where: { id: 'board-1' },
        include: {
          owner: true,
          workspace: true,
          lists: {
            include: {
              cards: {
                orderBy: {
                  position: 'asc',
                },
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(result).toBe(boardWithLists);
    });

    it('throws NotFoundException when boardId is empty', async () => {
      await expect(service.board('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when boardId is whitespace only', async () => {
      await expect(service.board('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when board does not exist', async () => {
      prisma.board.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.board('board-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
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

      await expect(service.board('board-1', 'user-2')).rejects.toThrow(ForbiddenException);
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
    });

    it('returns board with empty lists array when board has no lists', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'My Board',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const boardWithEmptyLists = {
        ...boardWithWorkspace,
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace: boardWithWorkspace.workspace,
        lists: [],
      };
      prisma.board.findUnique = jest
        .fn()
        .mockResolvedValueOnce(boardWithWorkspace)
        .mockResolvedValueOnce(boardWithEmptyLists);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.board('board-1', 'user-1');

      expect(result).toBe(boardWithEmptyLists);
      expect(result?.lists).toEqual([]);
    });
  });

  describe('updateBoard', () => {
    it('updates board title when user is a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'Old Title',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedBoard = {
        ...boardWithWorkspace,
        title: 'New Title',
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace: boardWithWorkspace.workspace,
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.board.update = jest.fn().mockResolvedValue(updatedBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateBoard('board-1', 'New Title', 'user-1');

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
      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: { title: 'New Title' },
        include: {
          owner: true,
          workspace: true,
        },
      });
      expect(result).toBe(updatedBoard);
      expect(result.title).toBe('New Title');
    });

    it('updates board with description and background when provided', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'Old Title',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedBoard = {
        ...boardWithWorkspace,
        title: 'New Title',
        description: 'New Description',
        background: '#ff0000',
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace: boardWithWorkspace.workspace,
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.board.update = jest.fn().mockResolvedValue(updatedBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateBoard(
        'board-1',
        'New Title',
        'user-1',
        'New Description',
        '#ff0000'
      );

      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: {
          title: 'New Title',
          description: 'New Description',
          background: '#ff0000',
        },
        include: {
          owner: true,
          workspace: true,
        },
      });
      expect(result).toBe(updatedBoard);
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Description');
      expect(result.background).toBe('#ff0000');
    });

    it('updates board with only description when background is not provided', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'Old Title',
        description: null,
        background: '#0079bf',
        ownerId: 'user-1',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedBoard = {
        ...boardWithWorkspace,
        title: 'New Title',
        description: 'New Description',
        owner: { id: 'user-1', username: 'user1', email: 'user1@example.com' },
        workspace: boardWithWorkspace.workspace,
      };
      prisma.board.findUnique = jest.fn().mockResolvedValue(boardWithWorkspace);
      prisma.board.update = jest.fn().mockResolvedValue(updatedBoard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateBoard('board-1', 'New Title', 'user-1', 'New Description');

      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: {
          title: 'New Title',
          description: 'New Description',
        },
        include: {
          owner: true,
          workspace: true,
        },
      });
      expect(result.description).toBe('New Description');
    });

    it('throws NotFoundException when boardId is empty', async () => {
      await expect(service.updateBoard('', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when boardId is whitespace only', async () => {
      await expect(service.updateBoard('   ', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.updateBoard('board-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is whitespace only', async () => {
      await expect(service.updateBoard('board-1', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when board does not exist', async () => {
      prisma.board.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateBoard('board-1', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.board.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const boardWithWorkspace = {
        id: 'board-1',
        title: 'Old Title',
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

      await expect(service.updateBoard('board-1', 'New Title', 'user-2')).rejects.toThrow(
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
      expect(prisma.board.update).not.toHaveBeenCalled();
    });
  });
});

