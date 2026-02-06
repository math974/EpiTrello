import { User } from '@prisma/client';
import { ChecklistsResolver } from './checklists.resolver';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistInput } from './dto/create-checklist.input';
import { UpdateChecklistInput } from './dto/update-checklist.input';
import { DeleteChecklistInput } from './dto/delete-checklist.input';
import { ReorderChecklistsInput } from './dto/reorder-checklists.input';
import { CreateChecklistItemInput } from './dto/create-checklist-item.input';
import { UpdateChecklistItemInput } from './dto/update-checklist-item.input';
import { DeleteChecklistItemInput } from './dto/delete-checklist-item.input';
import { ReorderChecklistItemsInput } from './dto/reorder-checklist-items.input';

describe('ChecklistsResolver', () => {
  const checklistsService = {
    createChecklist: jest.fn(),
    updateChecklist: jest.fn(),
    deleteChecklist: jest.fn(),
    reorderChecklists: jest.fn(),
    createChecklistItem: jest.fn(),
    updateChecklistItem: jest.fn(),
    deleteChecklistItem: jest.fn(),
    reorderChecklistItems: jest.fn(),
  } as unknown as ChecklistsService;
  const resolver = new ChecklistsResolver(checklistsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createChecklist', () => {
    it('creates a checklist for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: CreateChecklistInput = {
        cardId: 'card-1',
        title: 'My Checklist',
      };
      const checklist = {
        id: 'checklist-1',
        cardId: 'card-1',
        title: 'My Checklist',
        position: 0,
        items: [],
      };

      checklistsService.createChecklist = jest.fn().mockResolvedValue(checklist);

      const result = await resolver.createChecklist(input, user);

      expect(checklistsService.createChecklist).toHaveBeenCalledWith(
        input.cardId,
        input.title,
        user.id
      );
      expect(result).toBe(checklist);
    });
  });

  describe('updateChecklist', () => {
    it('updates a checklist for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: UpdateChecklistInput = {
        id: 'checklist-1',
        title: 'Updated Title',
      };
      const checklist = {
        id: 'checklist-1',
        title: 'Updated Title',
        items: [],
      };

      checklistsService.updateChecklist = jest.fn().mockResolvedValue(checklist);

      const result = await resolver.updateChecklist(input, user);

      expect(checklistsService.updateChecklist).toHaveBeenCalledWith(
        input.id,
        input.title,
        user.id
      );
      expect(result).toBe(checklist);
    });
  });

  describe('deleteChecklist', () => {
    it('deletes a checklist for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: DeleteChecklistInput = {
        id: 'checklist-1',
      };

      checklistsService.deleteChecklist = jest.fn().mockResolvedValue(true);

      const result = await resolver.deleteChecklist(input, user);

      expect(checklistsService.deleteChecklist).toHaveBeenCalledWith(input.id, user.id);
      expect(result).toBe(true);
    });
  });

  describe('reorderChecklists', () => {
    it('reorders checklists for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: ReorderChecklistsInput = {
        cardId: 'card-1',
        checklistIds: ['checklist-1', 'checklist-2'],
      };

      checklistsService.reorderChecklists = jest.fn().mockResolvedValue(true);

      const result = await resolver.reorderChecklists(input, user);

      expect(checklistsService.reorderChecklists).toHaveBeenCalledWith(
        input.cardId,
        input.checklistIds,
        user.id
      );
      expect(result).toBe(true);
    });
  });

  describe('createChecklistItem', () => {
    it('creates a checklist item for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: CreateChecklistItemInput = {
        checklistId: 'checklist-1',
        content: 'My Item',
      };
      const item = {
        id: 'item-1',
        checklistId: 'checklist-1',
        content: 'My Item',
        checked: false,
        position: 0,
      };

      checklistsService.createChecklistItem = jest.fn().mockResolvedValue(item);

      const result = await resolver.createChecklistItem(input, user);

      expect(checklistsService.createChecklistItem).toHaveBeenCalledWith(
        input.checklistId,
        input.content,
        user.id
      );
      expect(result).toBe(item);
    });
  });

  describe('updateChecklistItem', () => {
    it('updates a checklist item for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: UpdateChecklistItemInput = {
        id: 'item-1',
        content: 'Updated Content',
        checked: true,
      };
      const item = {
        id: 'item-1',
        content: 'Updated Content',
        checked: true,
      };

      checklistsService.updateChecklistItem = jest.fn().mockResolvedValue(item);

      const result = await resolver.updateChecklistItem(input, user);

      expect(checklistsService.updateChecklistItem).toHaveBeenCalledWith(
        input.id,
        user.id,
        input.content,
        input.checked
      );
      expect(result).toBe(item);
    });
  });

  describe('deleteChecklistItem', () => {
    it('deletes a checklist item for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: DeleteChecklistItemInput = {
        id: 'item-1',
      };

      checklistsService.deleteChecklistItem = jest.fn().mockResolvedValue(true);

      const result = await resolver.deleteChecklistItem(input, user);

      expect(checklistsService.deleteChecklistItem).toHaveBeenCalledWith(input.id, user.id);
      expect(result).toBe(true);
    });
  });

  describe('reorderChecklistItems', () => {
    it('reorders checklist items for the current user', async () => {
      const user = { id: 'user-1' } as User;
      const input: ReorderChecklistItemsInput = {
        checklistId: 'checklist-1',
        itemIds: ['item-1', 'item-2'],
      };

      checklistsService.reorderChecklistItems = jest.fn().mockResolvedValue(true);

      const result = await resolver.reorderChecklistItems(input, user);

      expect(checklistsService.reorderChecklistItems).toHaveBeenCalledWith(
        input.checklistId,
        input.itemIds,
        user.id
      );
      expect(result).toBe(true);
    });
  });
});


