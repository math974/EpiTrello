import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ChecklistsService } from './checklists.service';

describe('ChecklistsService', () => {
  const prisma = {
    card: {
      findUnique: jest.fn(),
    },
    checklist: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    checklistItem: {
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
  const service = new ChecklistsService(prisma, workspacesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChecklist', () => {
    it('creates a checklist with position 0 when card has no checklists', async () => {
      const cardWithRelations = {
        id: 'card-1',
        title: 'My Card',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findFirst = jest.fn().mockResolvedValue(null);
      prisma.checklist.create = jest.fn().mockResolvedValue({
        id: 'checklist-1',
        cardId: 'card-1',
        title: 'My Checklist',
        position: 0,
        items: [],
      });

      const result = await service.createChecklist('card-1', 'My Checklist', 'user-1');

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
      expect(prisma.checklist.findFirst).toHaveBeenCalledWith({
        where: { cardId: 'card-1' },
        orderBy: { position: 'desc' },
      });
      expect(prisma.checklist.create).toHaveBeenCalledWith({
        data: {
          title: 'My Checklist',
          cardId: 'card-1',
          position: 0,
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
      expect(result.position).toBe(0);
    });

    it('creates a checklist with incremented position when card has existing checklists', async () => {
      const cardWithRelations = {
        id: 'card-1',
        title: 'My Card',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findFirst = jest.fn().mockResolvedValue({
        id: 'checklist-0',
        position: 2,
      });
      prisma.checklist.create = jest.fn().mockResolvedValue({
        id: 'checklist-1',
        cardId: 'card-1',
        title: 'My Checklist',
        position: 3,
        items: [],
      });

      const result = await service.createChecklist('card-1', 'My Checklist', 'user-1');

      expect(prisma.checklist.create).toHaveBeenCalledWith({
        data: {
          title: 'My Checklist',
          cardId: 'card-1',
          position: 3,
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
      expect(result.position).toBe(3);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.createChecklist('', 'My Checklist', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.createChecklist('card-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card is not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createChecklist('card-1', 'My Checklist', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const cardWithRelations = {
        id: 'card-1',
        title: 'My Card',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.createChecklist('card-1', 'My Checklist', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.checklist.create).not.toHaveBeenCalled();
    });

    it('trims the title', async () => {
      const cardWithRelations = {
        id: 'card-1',
        title: 'My Card',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findFirst = jest.fn().mockResolvedValue(null);
      prisma.checklist.create = jest.fn().mockResolvedValue({
        id: 'checklist-1',
        cardId: 'card-1',
        title: 'My Checklist',
        position: 0,
        items: [],
      });

      await service.createChecklist('card-1', '  My Checklist  ', 'user-1');

      expect(prisma.checklist.create).toHaveBeenCalledWith({
        data: {
          title: 'My Checklist',
          cardId: 'card-1',
          position: 0,
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
    });
  });

  describe('updateChecklist', () => {
    it('updates a checklist successfully', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        title: 'Old Title',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.update = jest.fn().mockResolvedValue({
        id: 'checklist-1',
        title: 'New Title',
        items: [],
      });

      const result = await service.updateChecklist('checklist-1', 'New Title', 'user-1');

      expect(prisma.checklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
        data: {
          title: 'New Title',
        },
        include: {
          items: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });
      expect(result.title).toBe('New Title');
    });

    it('throws NotFoundException when checklistId is empty', async () => {
      await expect(service.updateChecklist('', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when title is empty', async () => {
      await expect(service.updateChecklist('checklist-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when checklist is not found', async () => {
      prisma.checklist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateChecklist('checklist-1', 'New Title', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.updateChecklist('checklist-1', 'New Title', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('deleteChecklist', () => {
    it('deletes a checklist and reorganizes positions', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        position: 1,
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.checklist.delete = jest.fn();
      prisma.checklist.updateMany = jest.fn();

      const result = await service.deleteChecklist('checklist-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.checklist.delete).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
      });
      expect(prisma.checklist.updateMany).toHaveBeenCalledWith({
        where: {
          cardId: 'card-1',
          position: {
            gt: 1,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when checklistId is empty', async () => {
      await expect(service.deleteChecklist('', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when checklist is not found', async () => {
      prisma.checklist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteChecklist('checklist-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.deleteChecklist('checklist-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('reorderChecklists', () => {
    it('reorders checklists successfully', async () => {
      const cardWithRelations = {
        id: 'card-1',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findMany = jest.fn().mockResolvedValue([
        { id: 'checklist-1' },
        { id: 'checklist-2' },
        { id: 'checklist-3' },
      ]);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.checklist.update = jest.fn();

      const result = await service.reorderChecklists(
        'card-1',
        ['checklist-3', 'checklist-1', 'checklist-2'],
        'user-1'
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.checklist.update).toHaveBeenCalledTimes(3);
      expect(prisma.checklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-3' },
        data: { position: 0 },
      });
      expect(prisma.checklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-1' },
        data: { position: 1 },
      });
      expect(prisma.checklist.update).toHaveBeenCalledWith({
        where: { id: 'checklist-2' },
        data: { position: 2 },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(
        service.reorderChecklists('', ['checklist-1'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when orderedChecklistIds is empty', async () => {
      await expect(service.reorderChecklists('card-1', [], 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when checklist does not belong to card', async () => {
      const cardWithRelations = {
        id: 'card-1',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findMany = jest.fn().mockResolvedValue([{ id: 'checklist-1' }]);

      await expect(
        service.reorderChecklists('card-1', ['checklist-2'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when not all checklists are included', async () => {
      const cardWithRelations = {
        id: 'card-1',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
            },
          },
        },
      };

      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklist.findMany = jest.fn().mockResolvedValue([
        { id: 'checklist-1' },
        { id: 'checklist-2' },
      ]);

      await expect(
        service.reorderChecklists('card-1', ['checklist-1'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createChecklistItem', () => {
    it('creates a checklist item with position 0 when checklist has no items', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findFirst = jest.fn().mockResolvedValue(null);
      prisma.checklistItem.create = jest.fn().mockResolvedValue({
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'My Item',
        checked: false,
        position: 0,
      });

      const result = await service.createChecklistItem('checklist-1', 'My Item', 'user-1');

      expect(prisma.checklistItem.create).toHaveBeenCalledWith({
        data: {
          content: 'My Item',
          checklistId: 'checklist-1',
          position: 0,
        },
      });
      expect(result.position).toBe(0);
    });

    it('creates a checklist item with position incremented when checklist has items', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      const lastItem = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'First Item',
        checked: false,
        position: 2,
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findFirst = jest.fn().mockResolvedValue(lastItem);
      prisma.checklistItem.create = jest.fn().mockResolvedValue({
        id: 'item-2',
        checklistId: 'checklist-1',
        content: 'My Item',
        checked: false,
        position: 3,
      });

      const result = await service.createChecklistItem('checklist-1', 'My Item', 'user-1');

      expect(prisma.checklistItem.create).toHaveBeenCalledWith({
        data: {
          content: 'My Item',
          checklistId: 'checklist-1',
          position: 3,
        },
      });
      expect(result.position).toBe(3);
    });

    it('throws NotFoundException when checklistId is empty', async () => {
      await expect(service.createChecklistItem('', 'My Item', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when content is empty', async () => {
      await expect(service.createChecklistItem('checklist-1', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when checklist is not found', async () => {
      prisma.checklist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.createChecklistItem('checklist-1', 'My Item', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateChecklistItem', () => {
    it('updates checklist item content successfully', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'Old Content',
        checked: false,
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.update = jest.fn().mockResolvedValue({
        id: 'item-1',
        content: 'New Content',
        checked: false,
      });

      const result = await service.updateChecklistItem('item-1', 'user-1', 'New Content', null);

      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          content: 'New Content',
        },
      });
      expect(result).toBeDefined();
      expect(result?.content).toBe('New Content');
    });

    it('updates checklist item checked status successfully', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'My Item',
        checked: false,
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.update = jest.fn().mockResolvedValue({
        id: 'item-1',
        content: 'My Item',
        checked: true,
      });

      const result = await service.updateChecklistItem('item-1', 'user-1', null, true);

      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          checked: true,
        },
      });
      expect(result).toBeDefined();
      expect(result?.checked).toBe(true);
    });

    it('updates checklist item with both content and checked', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'Old Content',
        checked: false,
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.update = jest.fn().mockResolvedValue({
        id: 'item-1',
        content: 'New Content',
        checked: true,
      });

      const result = await service.updateChecklistItem('item-1', 'user-1', 'New Content', true);

      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: {
          content: 'New Content',
          checked: true,
        },
      });
      expect(result).toBeDefined();
      expect(result?.content).toBe('New Content');
      expect(result?.checked).toBe(true);
    });

    it('throws NotFoundException when itemId is empty', async () => {
      await expect(service.updateChecklistItem('', 'user-1', 'New Content', null)).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when content is empty string', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });

      await expect(service.updateChecklistItem('item-1', 'user-1', '', null)).rejects.toThrow(
        NotFoundException
      );
    });

    it('returns item without update when no fields provided', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'My Item',
        checked: false,
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findUnique = jest.fn().mockResolvedValueOnce(itemWithRelations).mockResolvedValueOnce({
        id: 'item-1',
        content: 'My Item',
        checked: false,
      });

      const result = await service.updateChecklistItem('item-1', 'user-1', undefined, undefined);

      expect(prisma.checklistItem.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('deleteChecklistItem', () => {
    it('deletes a checklist item and reorganizes positions', async () => {
      const itemWithRelations = {
        id: 'item-1',
        checklistId: 'checklist-1',
        position: 1,
        checklist: {
          id: 'checklist-1',
          cardId: 'card-1',
          card: {
            id: 'card-1',
            listId: 'list-1',
            list: {
              id: 'list-1',
              boardId: 'board-1',
              board: {
                id: 'board-1',
                workspaceId: 'workspace-1',
                workspace: {
                  id: 'workspace-1',
                },
              },
            },
          },
        },
      };

      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(itemWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.checklistItem.delete = jest.fn();
      prisma.checklistItem.updateMany = jest.fn();

      const result = await service.deleteChecklistItem('item-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.checklistItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(prisma.checklistItem.updateMany).toHaveBeenCalledWith({
        where: {
          checklistId: 'checklist-1',
          position: {
            gt: 1,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when itemId is empty', async () => {
      await expect(service.deleteChecklistItem('', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when item is not found', async () => {
      prisma.checklistItem.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteChecklistItem('item-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('reorderChecklistItems', () => {
    it('reorders checklist items successfully', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findMany = jest.fn().mockResolvedValue([
        { id: 'item-1' },
        { id: 'item-2' },
        { id: 'item-3' },
      ]);
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.checklistItem.update = jest.fn();

      const result = await service.reorderChecklistItems(
        'checklist-1',
        ['item-3', 'item-1', 'item-2'],
        'user-1'
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.checklistItem.update).toHaveBeenCalledTimes(3);
      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'item-3' },
        data: { position: 0 },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when checklistId is empty', async () => {
      await expect(service.reorderChecklistItems('', ['item-1'], 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when orderedItemIds is empty', async () => {
      await expect(service.reorderChecklistItems('checklist-1', [], 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when item does not belong to checklist', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findMany = jest.fn().mockResolvedValue([{ id: 'item-1' }]);

      await expect(
        service.reorderChecklistItems('checklist-1', ['item-2'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when checklist is not found', async () => {
      prisma.checklist.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.reorderChecklistItems('checklist-1', ['item-1'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when not all items are included', async () => {
      const checklistWithRelations = {
        id: 'checklist-1',
        cardId: 'card-1',
        card: {
          id: 'card-1',
          listId: 'list-1',
          list: {
            id: 'list-1',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              workspaceId: 'workspace-1',
              workspace: {
                id: 'workspace-1',
              },
            },
          },
        },
      };

      prisma.checklist.findUnique = jest.fn().mockResolvedValue(checklistWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      prisma.checklistItem.findMany = jest.fn().mockResolvedValue([
        { id: 'item-1' },
        { id: 'item-2' },
      ]);

      await expect(
        service.reorderChecklistItems('checklist-1', ['item-1'], 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

