import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CardsService } from './cards.service';

describe('CardsService', () => {
  const prisma = {
    list: {
      findUnique: jest.fn(),
    },
    card: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const service = new CardsService(prisma, workspacesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCard', () => {
    it('creates a card with position 0 when list has no cards', async () => {
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
      const newCard = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: listWithBoard,
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      prisma.card.findFirst = jest.fn().mockResolvedValue(null);
      prisma.card.create = jest.fn().mockResolvedValue(newCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createCard('list-1', 'My Card', 'user-1');

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
      expect(prisma.card.findFirst).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        orderBy: { position: 'desc' },
      });
      expect(prisma.card.create).toHaveBeenCalledWith({
        data: {
          title: 'My Card',
          listId: 'list-1',
          position: 0,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(newCard);
      expect(result.position).toBe(0);
    });

    it('creates a card with position auto-calculated when list has existing cards', async () => {
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
      const lastCard = {
        id: 'card-1',
        title: 'Existing Card',
        position: 2,
        listId: 'list-1',
      };
      const newCard = {
        id: 'card-2',
        title: 'New Card',
        description: null,
        position: 3,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: listWithBoard,
      };
      prisma.list.findUnique = jest.fn().mockResolvedValue(listWithBoard);
      prisma.card.findFirst = jest.fn().mockResolvedValue(lastCard);
      prisma.card.create = jest.fn().mockResolvedValue(newCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createCard('list-1', 'New Card', 'user-1');

      expect(prisma.card.findFirst).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
        orderBy: { position: 'desc' },
      });
      expect(prisma.card.create).toHaveBeenCalledWith({
        data: {
          title: 'New Card',
          listId: 'list-1',
          position: 3,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(newCard);
      expect(result.position).toBe(3);
    });

    it('throws NotFoundException when listId is empty', async () => {
      await expect(service.createCard('', 'My Card', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when listId is whitespace only', async () => {
      await expect(service.createCard('   ', 'My Card', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.createCard('list-1', '', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is whitespace only', async () => {
      await expect(service.createCard('list-1', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when list does not exist', async () => {
      prisma.list.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createCard('list-1', 'My Card', 'user-1')).rejects.toThrow(
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
      expect(prisma.card.create).not.toHaveBeenCalled();
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

      await expect(service.createCard('list-1', 'My Card', 'user-2')).rejects.toThrow(
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
      expect(prisma.card.create).not.toHaveBeenCalled();
    });
  });
});

