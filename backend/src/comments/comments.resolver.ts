import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { AddCommentInput } from './dto/add-comment.input';
import { CommentModel } from './models/comment.model';
import { CommentsService } from './comments.service';

@Resolver(() => CommentModel)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Mutation(() => CommentModel)
  @AuthGuard()
  async addComment(
    @Args('input', { type: () => AddCommentInput }) input: AddCommentInput,
    @Context('user') user: User
  ) {
    return this.commentsService.addComment(input.cardId, input.content, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteComment(@Args('id') id: string, @Context('user') user: User) {
    return this.commentsService.deleteComment(id, user.id);
  }
}

