import { User } from '@prisma/client';
import { CardsResolver } from './cards.resolver';
import { CardsService } from './cards.service';

describe('CardsResolver', () => {
  const cardsService = {
    createCard: jest.fn(),
    updateCard: jest.fn(),
    archiveCard: jest.fn(),
    deleteCard: jest.fn(),
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

  it('updates a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'card-1', title: 'Updated Title', description: 'Updated description' };
    const updatedCard = {
      id: 'card-1',
      title: 'Updated Title',
      description: 'Updated description',
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.updateCard = jest.fn().mockResolvedValue(updatedCard);

    const result = await resolver.updateCard(input, user);

    expect(cardsService.updateCard).toHaveBeenCalledWith(
      'card-1',
      'user-1',
      'Updated Title',
      'Updated description'
    );
    expect(result).toBe(updatedCard);
  });

  it('updates a card with only title for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'card-1', title: 'Updated Title' };
    const updatedCard = {
      id: 'card-1',
      title: 'Updated Title',
      description: null,
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.updateCard = jest.fn().mockResolvedValue(updatedCard);

    const result = await resolver.updateCard(input, user);

    expect(cardsService.updateCard).toHaveBeenCalledWith('card-1', 'user-1', 'Updated Title', undefined);
    expect(result).toBe(updatedCard);
  });

  it('updates a card with only description for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'card-1', description: 'New description' };
    const updatedCard = {
      id: 'card-1',
      title: 'My Card',
      description: 'New description',
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.updateCard = jest.fn().mockResolvedValue(updatedCard);

    const result = await resolver.updateCard(input, user);

    expect(cardsService.updateCard).toHaveBeenCalledWith('card-1', 'user-1', undefined, 'New description');
    expect(result).toBe(updatedCard);
  });

  it('archives a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'card-1', archived: true };
    const archivedCard = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 1,
      archived: true,
      archivedPosition: 1,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.archiveCard = jest.fn().mockResolvedValue(archivedCard);

    const result = await resolver.archiveCard(input, user);

    expect(cardsService.archiveCard).toHaveBeenCalledWith('card-1', true, 'user-1');
    expect(result).toBe(archivedCard);
  });

  it('unarchives a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'card-1', archived: false };
    const unarchivedCard = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 1,
      archived: false,
      archivedPosition: null,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.archiveCard = jest.fn().mockResolvedValue(unarchivedCard);

    const result = await resolver.archiveCard(input, user);

    expect(cardsService.archiveCard).toHaveBeenCalledWith('card-1', false, 'user-1');
    expect(result).toBe(unarchivedCard);
  });

  it('deletes a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    cardsService.deleteCard = jest.fn().mockResolvedValue(true);

    const result = await resolver.deleteCard('card-1', user);

    expect(cardsService.deleteCard).toHaveBeenCalledWith('card-1', 'user-1');
    expect(result).toBe(true);
  });
});

