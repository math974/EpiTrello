import { User } from '@prisma/client';
import { ListsResolver } from './lists.resolver';
import { ListsService } from './lists.service';

describe('ListsResolver', () => {
  const listsService = {
    createList: jest.fn(),
    updateList: jest.fn(),
  } as unknown as ListsService;
  const resolver = new ListsResolver(listsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a list for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { boardId: 'board-1', title: 'To Do' };
    const list = {
      id: 'list-1',
      title: 'To Do',
      position: 0,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    listsService.createList = jest.fn().mockResolvedValue(list);

    const result = await resolver.createList(input, user);

    expect(listsService.createList).toHaveBeenCalledWith('board-1', 'To Do', 'user-1');
    expect(result).toBe(list);
  });

  it('updates a list for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'list-1', title: 'Updated Title' };
    const updatedList = {
      id: 'list-1',
      title: 'Updated Title',
      position: 0,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    listsService.updateList = jest.fn().mockResolvedValue(updatedList);

    const result = await resolver.updateList(input, user);

    expect(listsService.updateList).toHaveBeenCalledWith('list-1', 'Updated Title', 'user-1');
    expect(result).toBe(updatedList);
  });
});

