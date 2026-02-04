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
}

