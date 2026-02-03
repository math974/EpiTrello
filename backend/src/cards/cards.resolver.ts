import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateCardInput } from './dto/create-card.input';
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
}

