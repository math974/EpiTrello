import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateListInput } from './dto/create-list.input';
import { ListModel } from '../boards/models/list.model';
import { ListsService } from './lists.service';

@Resolver(() => ListModel)
export class ListsResolver {
  constructor(private readonly listsService: ListsService) {}

  @Mutation(() => ListModel)
  @AuthGuard()
  async createList(
    @Args('input', { type: () => CreateListInput }) input: CreateListInput,
    @Context('user') user: User
  ) {
    return this.listsService.createList(input.boardId, input.title, user.id);
  }
}

