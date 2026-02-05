import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  const prisma = {
    card: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const activitiesService = {
    logActivity: jest.fn().mockResolvedValue(undefined),
  } as unknown as any;
  const service = new CommentsService(prisma, workspacesService, activitiesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('creates a comment when user is a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
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
      const newComment = {
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
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.comment.create = jest.fn().mockResolvedValue(newComment);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.addComment('card-1', 'This is a comment', 'user-1');

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
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'This is a comment',
          cardId: 'card-1',
          authorId: 'user-1',
        },
        include: {
          author: true,
        },
      });
      expect(result).toBe(newComment);
      expect(result.content).toBe('This is a comment');
      expect(result.authorId).toBe('user-1');
    });

    it('trims content whitespace when creating a comment', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
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
      const newComment = {
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
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithList);
      prisma.comment.create = jest.fn().mockResolvedValue(newComment);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.addComment('card-1', '  This is a comment  ', 'user-1');

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: 'This is a comment',
          cardId: 'card-1',
          authorId: 'user-1',
        },
        include: {
          author: true,
        },
      });
      expect(result).toBe(newComment);
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(service.addComment('', 'This is a comment', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is whitespace only', async () => {
      await expect(service.addComment('   ', 'This is a comment', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when content is empty', async () => {
      await expect(service.addComment('card-1', '', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when content is whitespace only', async () => {
      await expect(service.addComment('card-1', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.card.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when card does not exist', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.addComment('card-1', 'This is a comment', 'user-1')).rejects.toThrow(
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
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const cardWithList = {
        id: 'card-1',
        title: 'My Card',
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

      await expect(service.addComment('card-1', 'This is a comment', 'user-2')).rejects.toThrow(
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
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('deletes a comment when user is the author', async () => {
      const commentWithCard = {
        id: 'comment-1',
        content: 'This is a comment',
        cardId: 'card-1',
        authorId: 'user-1',
        author: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
        card: {
          id: 'card-1',
          title: 'My Card',
          listId: 'list-1',
          list: {
            id: 'list-1',
            title: 'My List',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              title: 'My Board',
              workspaceId: 'workspace-1',
              workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-2' },
            },
          },
        },
      };
      prisma.comment.findUnique = jest.fn().mockResolvedValue(commentWithCard);
      prisma.comment.delete = jest.fn().mockResolvedValue(commentWithCard);

      const result = await service.deleteComment('comment-1', 'user-1');

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: {
          author: true,
          card: {
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
          },
        },
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(result).toBe(true);
    });

    it('deletes a comment when user is the workspace owner', async () => {
      const commentWithCard = {
        id: 'comment-1',
        content: 'This is a comment',
        cardId: 'card-1',
        authorId: 'user-2',
        author: {
          id: 'user-2',
          username: 'author',
          email: 'author@example.com',
        },
        card: {
          id: 'card-1',
          title: 'My Card',
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
        },
      };
      prisma.comment.findUnique = jest.fn().mockResolvedValue(commentWithCard);
      prisma.comment.delete = jest.fn().mockResolvedValue(commentWithCard);

      const result = await service.deleteComment('comment-1', 'user-1');

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: {
          author: true,
          card: {
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
          },
        },
      });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when commentId is empty', async () => {
      await expect(service.deleteComment('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.comment.findUnique).not.toHaveBeenCalled();
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when commentId is whitespace only', async () => {
      await expect(service.deleteComment('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.comment.findUnique).not.toHaveBeenCalled();
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when comment does not exist', async () => {
      prisma.comment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteComment('comment-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: {
          author: true,
          card: {
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
          },
        },
      });
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is neither author nor workspace owner', async () => {
      const commentWithCard = {
        id: 'comment-1',
        content: 'This is a comment',
        cardId: 'card-1',
        authorId: 'user-2',
        author: {
          id: 'user-2',
          username: 'author',
          email: 'author@example.com',
        },
        card: {
          id: 'card-1',
          title: 'My Card',
          listId: 'list-1',
          list: {
            id: 'list-1',
            title: 'My List',
            boardId: 'board-1',
            board: {
              id: 'board-1',
              title: 'My Board',
              workspaceId: 'workspace-1',
              workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-3' },
            },
          },
        },
      };
      prisma.comment.findUnique = jest.fn().mockResolvedValue(commentWithCard);

      await expect(service.deleteComment('comment-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        include: {
          author: true,
          card: {
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
          },
        },
      });
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });
});

