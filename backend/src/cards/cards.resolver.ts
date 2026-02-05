import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateCardInput } from './dto/create-card.input';
import { UpdateCardInput } from './dto/update-card.input';
import { ArchiveCardInput } from './dto/archive-card.input';
import { MoveCardInput } from './dto/move-card.input';
import { AddLabelToCardInput } from './dto/add-label-to-card.input';
import { RemoveLabelFromCardInput } from './dto/remove-label-from-card.input';
import { SetCardDueDateInput } from './dto/set-card-due-date.input';
import { ClearCardDueDateInput } from './dto/clear-card-due-date.input';
import { SetCardDoneInput } from './dto/set-card-done.input';
import { CardModel } from '../boards/models/card.model';
import { CardsService } from './cards.service';

@Resolver(() => CardModel)
export class CardsResolver {
  constructor(private readonly cardsService: CardsService) {}

  @Mutation(() => CardModel)
  @AuthGuard()
  async createCard(
    @Args('input', { type: () => CreateCardInput }) input: CreateCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.createCard(input.listId, input.title, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async updateCard(
    @Args('input', { type: () => UpdateCardInput }) input: UpdateCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.updateCard(input.id, user.id, input.title, input.description);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async archiveCard(
    @Args('input', { type: () => ArchiveCardInput }) input: ArchiveCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.archiveCard(input.id, input.archived, user.id);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteCard(@Args('id') id: string, @Context('user') user: User) {
    return this.cardsService.deleteCard(id, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async moveCard(
    @Args('input', { type: () => MoveCardInput }) input: MoveCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.moveCard(input.cardId, input.toListId, input.toIndex, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async addLabelToCard(
    @Args('input', { type: () => AddLabelToCardInput }) input: AddLabelToCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.addLabelToCard(input.cardId, input.labelId, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async removeLabelFromCard(
    @Args('input', { type: () => RemoveLabelFromCardInput }) input: RemoveLabelFromCardInput,
    @Context('user') user: User
  ) {
    return this.cardsService.removeLabelFromCard(input.cardId, input.labelId, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async setCardDueDate(
    @Args('input', { type: () => SetCardDueDateInput }) input: SetCardDueDateInput,
    @Context('user') user: User
  ) {
    return this.cardsService.setCardDueDate(input.cardId, new Date(input.dueDate), user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async clearCardDueDate(
    @Args('input', { type: () => ClearCardDueDateInput }) input: ClearCardDueDateInput,
    @Context('user') user: User
  ) {
    return this.cardsService.clearCardDueDate(input.cardId, user.id);
  }

  @Mutation(() => CardModel)
  @AuthGuard()
  async setCardDone(
    @Args('input', { type: () => SetCardDoneInput }) input: SetCardDoneInput,
    @Context('user') user: User
  ) {
    return this.cardsService.setCardDone(input.cardId, input.done, user.id);
  }
}

