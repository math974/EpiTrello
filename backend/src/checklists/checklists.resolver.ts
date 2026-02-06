import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateChecklistInput } from './dto/create-checklist.input';
import { UpdateChecklistInput } from './dto/update-checklist.input';
import { DeleteChecklistInput } from './dto/delete-checklist.input';
import { ReorderChecklistsInput } from './dto/reorder-checklists.input';
import { CreateChecklistItemInput } from './dto/create-checklist-item.input';
import { UpdateChecklistItemInput } from './dto/update-checklist-item.input';
import { DeleteChecklistItemInput } from './dto/delete-checklist-item.input';
import { ReorderChecklistItemsInput } from './dto/reorder-checklist-items.input';
import { ChecklistModel } from './models/checklist.model';
import { ChecklistItemModel } from './models/checklist-item.model';
import { ChecklistsService } from './checklists.service';

@Resolver(() => ChecklistModel)
export class ChecklistsResolver {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Mutation(() => ChecklistModel)
  @AuthGuard()
  async createChecklist(
    @Args('input', { type: () => CreateChecklistInput }) input: CreateChecklistInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.createChecklist(input.cardId, input.title, user.id);
  }

  @Mutation(() => ChecklistModel)
  @AuthGuard()
  async updateChecklist(
    @Args('input', { type: () => UpdateChecklistInput }) input: UpdateChecklistInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.updateChecklist(input.id, input.title, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteChecklist(
    @Args('input', { type: () => DeleteChecklistInput }) input: DeleteChecklistInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.deleteChecklist(input.id, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async reorderChecklists(
    @Args('input', { type: () => ReorderChecklistsInput }) input: ReorderChecklistsInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.reorderChecklists(input.cardId, input.checklistIds, user.id);
  }

  @Mutation(() => ChecklistItemModel)
  @AuthGuard()
  async createChecklistItem(
    @Args('input', { type: () => CreateChecklistItemInput }) input: CreateChecklistItemInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.createChecklistItem(input.checklistId, input.content, user.id);
  }

  @Mutation(() => ChecklistItemModel)
  @AuthGuard()
  async updateChecklistItem(
    @Args('input', { type: () => UpdateChecklistItemInput }) input: UpdateChecklistItemInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.updateChecklistItem(
      input.id,
      user.id,
      input.content,
      input.checked
    );
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteChecklistItem(
    @Args('input', { type: () => DeleteChecklistItemInput }) input: DeleteChecklistItemInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.deleteChecklistItem(input.id, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async reorderChecklistItems(
    @Args('input', { type: () => ReorderChecklistItemsInput }) input: ReorderChecklistItemsInput,
    @Context('user') user: User
  ) {
    return this.checklistsService.reorderChecklistItems(
      input.checklistId,
      input.itemIds,
      user.id
    );
  }
}


