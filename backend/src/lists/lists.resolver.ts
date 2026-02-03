import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateListInput } from './dto/create-list.input';
import { UpdateListInput } from './dto/update-list.input';
import { ArchiveListInput } from './dto/archive-list.input';
import { ReorderListsInput } from './dto/reorder-lists.input';
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

  @Mutation(() => ListModel)
  @AuthGuard()
  async updateList(
    @Args('input', { type: () => UpdateListInput }) input: UpdateListInput,
    @Context('user') user: User
  ) {
    return this.listsService.updateList(input.id, input.title, user.id);
  }

  @Mutation(() => ListModel)
  @AuthGuard()
  async archiveList(
    @Args('input', { type: () => ArchiveListInput }) input: ArchiveListInput,
    @Context('user') user: User
  ) {
    return this.listsService.archiveList(input.id, input.archived, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteList(@Args('id') id: string, @Context('user') user: User) {
    return this.listsService.deleteList(id, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async reorderLists(
    @Args('input', { type: () => ReorderListsInput }) input: ReorderListsInput,
    @Context('user') user: User
  ) {
    return this.listsService.reorderLists(input.boardId, input.orderedListIds, user.id);
  }
}

