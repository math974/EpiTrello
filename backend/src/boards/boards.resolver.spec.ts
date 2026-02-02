import { User } from '@prisma/client';
import { BoardsResolver } from './boards.resolver';
import { BoardsService } from './boards.service';

describe('BoardsResolver', () => {
  const boardsService = {
    createBoard: jest.fn(),
  } as unknown as BoardsService;
  const resolver = new BoardsResolver(boardsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a board for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { workspaceId: 'workspace-1', title: 'My Board' };
    const board = {
      id: 'board-1',
      title: 'My Board',
      ownerId: 'user-1',
      workspaceId: 'workspace-1',
    };
    boardsService.createBoard = jest.fn().mockResolvedValue(board);

    const result = await resolver.createBoard(input, user);

    expect(boardsService.createBoard).toHaveBeenCalledWith('workspace-1', 'My Board', 'user-1');
    expect(result).toBe(board);
  });
});

