import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateBoardInput } from './dto/create-board.input';
import { BoardModel } from './models/board.model';
import { BoardsService } from './boards.service';

@Resolver(() => BoardModel)
export class BoardsResolver {
  constructor(private readonly boardsService: BoardsService) {}

  @Mutation(() => BoardModel)
  @AuthGuard()
  async createBoard(
    @Args('input', { type: () => CreateBoardInput }) input: CreateBoardInput,
    @Context('user') user: User
  ) {
    return this.boardsService.createBoard(input.workspaceId, input.title, user.id);
  }
}

