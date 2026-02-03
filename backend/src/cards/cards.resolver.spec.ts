import { User } from '@prisma/client';
import { CardsResolver } from './cards.resolver';
import { CardsService } from './cards.service';

describe('CardsResolver', () => {
  const cardsService = {
    createCard: jest.fn(),
  } as unknown as CardsService;
  const resolver = new CardsResolver(cardsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { listId: 'list-1', title: 'My Card' };
    const card = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.createCard = jest.fn().mockResolvedValue(card);

    const result = await resolver.createCard(input, user);

    expect(cardsService.createCard).toHaveBeenCalledWith('list-1', 'My Card', 'user-1');
    expect(result).toBe(card);
  });
});

