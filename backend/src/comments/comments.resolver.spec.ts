import { User } from '@prisma/client';
import { CommentsResolver } from './comments.resolver';
import { CommentsService } from './comments.service';

describe('CommentsResolver', () => {
  const commentsService = {
    addComment: jest.fn(),
    deleteComment: jest.fn(),
  } as unknown as CommentsService;
  const resolver = new CommentsResolver(commentsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a comment for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1', content: 'This is a comment' };
    const comment = {
      id: 'comment-1',
      content: 'This is a comment',
      cardId: 'card-1',
      authorId: 'user-1',
      author: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        avatar: null,
        createdAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    commentsService.addComment = jest.fn().mockResolvedValue(comment);

    const result = await resolver.addComment(input, user);

    expect(commentsService.addComment).toHaveBeenCalledWith(
      'card-1',
      'This is a comment',
      'user-1'
    );
    expect(result).toBe(comment);
  });

  it('deletes a comment for the current user', async () => {
    const user = { id: 'user-1' } as User;
    commentsService.deleteComment = jest.fn().mockResolvedValue(true);

    const result = await resolver.deleteComment('comment-1', user);

    expect(commentsService.deleteComment).toHaveBeenCalledWith('comment-1', 'user-1');
    expect(result).toBe(true);
  });
});

