import { User } from '@prisma/client';
import { ListsResolver } from './lists.resolver';
import { ListsService } from './lists.service';

describe('ListsResolver', () => {
  const listsService = {
    createList: jest.fn(),
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
});

