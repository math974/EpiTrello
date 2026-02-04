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
      findUnique: jest.fn(),
      update: jest.fn(),
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

  describe('updateCard', () => {
    it('updates a card title when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'Old Title',
        description: null,
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      const updatedCard = {
        id: 'card-1',
        title: 'New Title',
        description: null,
        position: 0,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: cardWithList.list,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateCard('card-1', 'user-1', 'New Title', undefined);

      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-1' },
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
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: {
          title: 'New Title',
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result?.title).toBe('New Title');
    });

    it('updates a card description when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      const updatedCard = {
        id: 'card-1',
        title: 'My Card',
        description: 'New description',
        position: 0,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: cardWithList.list,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateCard('card-1', 'user-1', undefined, 'New description');

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: {
          description: 'New description',
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result?.description).toBe('New description');
    });

    it('updates both title and description when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'Old Title',
        description: 'Old description',
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      const updatedCard = {
        id: 'card-1',
        title: 'New Title',
        description: 'New description',
        position: 0,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: cardWithList.list,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateCard('card-1', 'user-1', 'New Title', 'New description');

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: {
          title: 'New Title',
          description: 'New description',
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result?.title).toBe('New Title');
      expect(result?.description).toBe('New description');
    });

    it('returns card as is when no fields are provided for update', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateCard('card-1', 'user-1', undefined, undefined);

      expect(prisma.card.update).not.toHaveBeenCalled();
      expect(prisma.card.findUnique).toHaveBeenCalledTimes(2);
      expect(result).toBe(cardWithList);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.updateCard('', 'user-1', 'New Title', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is whitespace only', async () => {
      await expect(service.updateCard('   ', 'user-1', 'New Title', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty string', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.updateCard('card-1', 'user-1', '', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateCard('card-1', 'user-1', 'New Title', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-1' },
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
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        listId: 'list-1',
        list: {
          id: 'list-1',
          title: 'My List',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            title: 'My Board',
            workspaceId: 'workspace-1',
            workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
          },
        },
      };
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.updateCard('card-1', 'user-2', 'New Title', undefined)).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-1' },
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
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });
});

