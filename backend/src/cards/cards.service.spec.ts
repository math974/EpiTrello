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
      updateMany: jest.fn(),
    },
    label: {
      findUnique: jest.fn(),
    },
    cardLabel: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
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

  describe('archiveCard', () => {
    it('archives a card and reorganizes positions when user is a workspace member and archived is true', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 1,
        archived: false,
        archivedPosition: null,
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
      const archivedCard = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 1,
        archived: true,
        archivedPosition: 1, // Original position stored
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: cardWithList.list,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(archivedCard);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            update: jest.fn().mockResolvedValue(archivedCard),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveCard('card-1', true, 'user-1');

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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(archivedCard);
      expect(result?.archived).toBe(true);
    });

    it('unarchives a card and restores it to its original position when user is a workspace member and archived is false', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        archived: true,
        archivedPosition: 1, // Original position was 1
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
      const unarchivedCard = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 1,
        archived: false,
        archivedPosition: null,
        listId: 'list-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        list: cardWithList.list,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(unarchivedCard);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue(unarchivedCard),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.archiveCard('card-1', false, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(unarchivedCard);
      expect(result?.archived).toBe(false);
      expect(result?.position).toBe(1); // Restored to original position
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.archiveCard('', true, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is whitespace only', async () => {
      await expect(service.archiveCard('   ', true, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.archiveCard('card-1', true, 'user-1')).rejects.toThrow(
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
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        archived: false,
        archivedPosition: null,
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

      await expect(service.archiveCard('card-1', true, 'user-2')).rejects.toThrow(
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
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does nothing when card is already archived and archived is true', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        archived: true,
        archivedPosition: 0,
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

      const result = await service.archiveCard('card-1', true, 'user-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.card.updateMany).not.toHaveBeenCalled();
      expect(prisma.card.update).not.toHaveBeenCalled();
      expect(result).toBe(cardWithList);
    });

    it('does nothing when card is already unarchived and archived is false', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        archived: false,
        archivedPosition: null,
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

      const result = await service.archiveCard('card-1', false, 'user-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.card.updateMany).not.toHaveBeenCalled();
      expect(prisma.card.update).not.toHaveBeenCalled();
      expect(result).toBe(cardWithList);
    });
  });

  describe('deleteCard', () => {
    it('deletes a card and reorganizes positions when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 1,
        archived: false,
        archivedPosition: null,
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
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            delete: jest.fn().mockResolvedValue(cardWithList),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.deleteCard('card-1', 'user-1');

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
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('deletes a card at the end without reorganizing when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 2,
        archived: false,
        archivedPosition: null,
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
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            delete: jest.fn().mockResolvedValue(cardWithList),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.deleteCard('card-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.deleteCard('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is whitespace only', async () => {
      await expect(service.deleteCard('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteCard('card-1', 'user-1')).rejects.toThrow(NotFoundException);
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
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
        description: null,
        position: 0,
        archived: false,
        archivedPosition: null,
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

      await expect(service.deleteCard('card-1', 'user-2')).rejects.toThrow(ForbiddenException);
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
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('moveCard', () => {
    const cardWithList = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 1,
      archived: false,
      archivedPosition: null,
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

    const targetList = {
      id: 'list-2',
      title: 'Target List',
      boardId: 'board-1',
      board: {
        id: 'board-1',
        title: 'My Board',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      },
    };

    it('moves a card within the same list to the beginning when user is a workspace member', async () => {
      const allCards = [
        { id: 'card-1', position: 1 },
        { id: 'card-2', position: 2 },
        { id: 'card-3', position: 3 },
      ];
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      prisma.list.findUnique = jest.fn().mockResolvedValue(cardWithList.list);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            findMany: jest.fn().mockResolvedValue(allCards),
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            update: jest.fn().mockResolvedValue({ ...cardWithList, position: 0 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.moveCard('card-1', 'list-1', 0, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('moves a card within the same list to the end when user is a workspace member', async () => {
      const allCards = [
        { id: 'card-1', position: 1 },
        { id: 'card-2', position: 2 },
        { id: 'card-3', position: 3 },
      ];
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce({ ...cardWithList, position: 3 });
      prisma.list.findUnique = jest.fn().mockResolvedValue(cardWithList.list);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            findMany: jest.fn().mockResolvedValue(allCards),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            update: jest.fn().mockResolvedValue({ ...cardWithList, position: 3 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.moveCard('card-1', 'list-1', 3, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('moves a card to a different list when user is a workspace member', async () => {
      const targetListCards = [
        { id: 'card-4', position: 0 },
        { id: 'card-5', position: 1 },
      ];
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce({ ...cardWithList, listId: 'list-2', position: 1 });
      prisma.list.findUnique = jest.fn().mockResolvedValue(targetList);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            findMany: jest
              .fn()
              .mockResolvedValueOnce([{ id: 'card-2', position: 2 }]) // Cards in source list without moved card
              .mockResolvedValueOnce(targetListCards), // Cards in target list
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue({ ...cardWithList, listId: 'list-2', position: 1 }),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.moveCard('card-1', 'list-2', 1, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('does nothing when card is already at the target index in same list', async () => {
      const allCards = [
        { id: 'card-1', position: 1 },
        { id: 'card-2', position: 2 },
      ];
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      prisma.list.findUnique = jest.fn().mockResolvedValue(cardWithList.list);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const tx = {
          card: {
            findMany: jest.fn().mockResolvedValue(allCards),
            updateMany: jest.fn(),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.moveCard('card-1', 'list-1', 1, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.moveCard('', 'list-1', 0, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when toListId is empty', async () => {
      await expect(service.moveCard('card-1', '', 0, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when toIndex is negative', async () => {
      await expect(service.moveCard('card-1', 'list-1', -1, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.moveCard('card-1', 'list-1', 0, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.list.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target list does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.list.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.moveCard('card-1', 'list-2', 0, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when moving between different workspaces', async () => {
      const differentWorkspaceList = {
        ...targetList,
        board: {
          ...targetList.board,
          workspaceId: 'workspace-2',
          workspace: { id: 'workspace-2', name: 'Other', ownerId: 'user-2' },
        },
      };
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.list.findUnique = jest.fn().mockResolvedValue(differentWorkspaceList);

      await expect(service.moveCard('card-1', 'list-2', 0, 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.list.findUnique = jest.fn().mockResolvedValue(targetList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.moveCard('card-1', 'list-2', 0, 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('addLabelToCard', () => {
    const cardWithList = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      archived: false,
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

    const labelWithWorkspace = {
      id: 'label-1',
      name: 'Important',
      color: '#ff0000',
      workspaceId: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
    };

    it('adds a label to a card successfully', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      prisma.cardLabel.findUnique = jest.fn().mockResolvedValue(null);
      prisma.cardLabel.create = jest.fn().mockResolvedValue({
        cardId: 'card-1',
        labelId: 'label-1',
        createdAt: new Date(),
      });
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.addLabelToCard('card-1', 'label-1', 'user-1');

      expect(prisma.card.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: { workspace: true },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.cardLabel.findUnique).toHaveBeenCalledWith({
        where: {
          cardId_labelId: {
            cardId: 'card-1',
            labelId: 'label-1',
          },
        },
      });
      expect(prisma.cardLabel.create).toHaveBeenCalledWith({
        data: {
          cardId: 'card-1',
          labelId: 'label-1',
        },
      });
      expect(result).toBe(cardWithList);
    });

    it('does not throw error if label is already attached (idempotent)', async () => {
      const existingRelation = {
        cardId: 'card-1',
        labelId: 'label-1',
        createdAt: new Date(),
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      prisma.cardLabel.findUnique = jest.fn().mockResolvedValue(existingRelation);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.addLabelToCard('card-1', 'label-1', 'user-1');

      expect(prisma.cardLabel.findUnique).toHaveBeenCalledWith({
        where: {
          cardId_labelId: {
            cardId: 'card-1',
            labelId: 'label-1',
          },
        },
      });
      expect(prisma.cardLabel.create).not.toHaveBeenCalled();
      expect(result).toBe(cardWithList);
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.addLabelToCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when label is not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.addLabelToCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when label belongs to different workspace', async () => {
      const labelDifferentWorkspace = {
        id: 'label-1',
        name: 'Important',
        color: '#ff0000',
        workspaceId: 'workspace-2',
        workspace: { id: 'workspace-2', name: 'Other', ownerId: 'user-2' },
      };
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelDifferentWorkspace);

      await expect(service.addLabelToCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.addLabelToCard('card-1', 'label-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.addLabelToCard('', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when labelId is empty', async () => {
      await expect(service.addLabelToCard('card-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('removeLabelFromCard', () => {
    const cardWithList = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      archived: false,
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

    const labelWithWorkspace = {
      id: 'label-1',
      name: 'Important',
      color: '#ff0000',
      workspaceId: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
    };

    it('removes a label from a card successfully', async () => {
      const existingRelation = {
        cardId: 'card-1',
        labelId: 'label-1',
        createdAt: new Date(),
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      prisma.cardLabel.findUnique = jest.fn().mockResolvedValue(existingRelation);
      prisma.cardLabel.delete = jest.fn().mockResolvedValue(existingRelation);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.removeLabelFromCard('card-1', 'label-1', 'user-1');

      expect(prisma.card.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: { workspace: true },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.cardLabel.findUnique).toHaveBeenCalledWith({
        where: {
          cardId_labelId: {
            cardId: 'card-1',
            labelId: 'label-1',
          },
        },
      });
      expect(prisma.cardLabel.delete).toHaveBeenCalledWith({
        where: {
          cardId_labelId: {
            cardId: 'card-1',
            labelId: 'label-1',
          },
        },
      });
      expect(result).toBe(cardWithList);
    });

    it('does not throw error if label is not attached (idempotent)', async () => {
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithList)
        .mockResolvedValueOnce(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      prisma.cardLabel.findUnique = jest.fn().mockResolvedValue(null);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.removeLabelFromCard('card-1', 'label-1', 'user-1');

      expect(prisma.cardLabel.findUnique).toHaveBeenCalledWith({
        where: {
          cardId_labelId: {
            cardId: 'card-1',
            labelId: 'label-1',
          },
        },
      });
      expect(prisma.cardLabel.delete).not.toHaveBeenCalled();
      expect(result).toBe(cardWithList);
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.removeLabelFromCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when label is not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.removeLabelFromCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when label belongs to different workspace', async () => {
      const labelDifferentWorkspace = {
        id: 'label-1',
        name: 'Important',
        color: '#ff0000',
        workspaceId: 'workspace-2',
        workspace: { id: 'workspace-2', name: 'Other', ownerId: 'user-2' },
      };
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelDifferentWorkspace);

      await expect(service.removeLabelFromCard('card-1', 'label-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.removeLabelFromCard('card-1', 'label-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.cardLabel.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.removeLabelFromCard('', 'label-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when labelId is empty', async () => {
      await expect(service.removeLabelFromCard('card-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('setCardDueDate', () => {
    const cardWithList = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      archived: false,
      dueDate: null,
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

    it('sets due date on a card successfully', async () => {
      const dueDate = new Date('2024-12-31T23:59:59Z');
      const updatedCard = {
        ...cardWithList,
        dueDate,
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

      const result = await service.setCardDueDate('card-1', dueDate, 'user-1');

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
          dueDate,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result.dueDate).toEqual(dueDate);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.setCardDueDate('', new Date(), 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.setCardDueDate('card-1', new Date(), 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.setCardDueDate('card-1', new Date(), 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });

  describe('clearCardDueDate', () => {
    const cardWithDueDate = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      archived: false,
      dueDate: new Date('2024-12-31T23:59:59Z'),
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

    it('clears due date on a card successfully', async () => {
      const updatedCard = {
        ...cardWithDueDate,
        dueDate: null,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithDueDate)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.clearCardDueDate('card-1', 'user-1');

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
          dueDate: null,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result.dueDate).toBeNull();
    });

    it('clears due date even when card has no due date (idempotent)', async () => {
      const cardWithoutDueDate = {
        ...cardWithDueDate,
        dueDate: null,
      };
      const updatedCard = {
        ...cardWithoutDueDate,
        dueDate: null,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithoutDueDate)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.clearCardDueDate('card-1', 'user-1');

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: {
          dueDate: null,
        },
        include: {
          list: true,
        },
      });
      expect(result.dueDate).toBeNull();
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.clearCardDueDate('', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.clearCardDueDate('card-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithDueDate);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.clearCardDueDate('card-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });

  describe('setCardDone', () => {
    const cardWithList = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      archived: false,
      dueDate: null,
      done: false,
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

    it('sets done flag to true on a card successfully', async () => {
      const updatedCard = {
        ...cardWithList,
        done: true,
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

      const result = await service.setCardDone('card-1', true, 'user-1');

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
          done: true,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result.done).toBe(true);
    });

    it('sets done flag to false on a card successfully', async () => {
      const cardWithDoneTrue = {
        ...cardWithList,
        done: true,
      };
      const updatedCard = {
        ...cardWithDoneTrue,
        done: false,
      };
      prisma.card.findUnique = jest
        .fn()
        .mockResolvedValueOnce(cardWithDoneTrue)
        .mockResolvedValueOnce(updatedCard);
      prisma.card.update = jest.fn().mockResolvedValue(updatedCard);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.setCardDone('card-1', false, 'user-1');

      expect(prisma.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: {
          done: false,
        },
        include: {
          list: true,
        },
      });
      expect(result).toBe(updatedCard);
      expect(result.done).toBe(false);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.setCardDone('', true, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.setCardDone('card-1', true, 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.setCardDone('card-1', true, 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.card.update).not.toHaveBeenCalled();
    });
  });
});

