import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async addComment(cardId: string, content: string, userId: string) {
    // Validate cardId is provided
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    // Validate content is provided
    if (!content || content.trim() === '') {
      throw new NotFoundException('Content is required');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
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

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Create the comment
    return this.prisma.comment.create({
      data: {
        content: content.trim(),
        cardId,
        authorId: userId,
      },
      include: {
        author: true,
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    // Validate commentId is provided
    if (!commentId || commentId.trim() === '') {
      throw new NotFoundException('Comment ID is required');
    }

    // Find the comment with its author, card, list, board and workspace
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
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

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author OR the workspace owner
    const isAuthor = comment.authorId === userId;
    const isWorkspaceOwner = comment.card.list.board.workspace.ownerId === userId;

    if (!isAuthor && !isWorkspaceOwner) {
      throw new ForbiddenException(
        'Only the comment author or workspace owner can delete this comment'
      );
    }

    // Delete the comment
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return true;
  }
}

