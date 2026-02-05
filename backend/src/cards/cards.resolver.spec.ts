import { User } from '@prisma/client';
import { CardsResolver } from './cards.resolver';
import { CardsService } from './cards.service';

describe('CardsResolver', () => {
  const cardsService = {
    createCard: jest.fn(),
    updateCard: jest.fn(),
    archiveCard: jest.fn(),
    deleteCard: jest.fn(),
    moveCard: jest.fn(),
    addLabelToCard: jest.fn(),
    removeLabelFromCard: jest.fn(),
    setCardDueDate: jest.fn(),
    clearCardDueDate: jest.fn(),
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

  it('moves a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1', toListId: 'list-2', toIndex: 1 };
    const movedCard = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 1,
      listId: 'list-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.moveCard = jest.fn().mockResolvedValue(movedCard);

    const result = await resolver.moveCard(input, user);

    expect(cardsService.moveCard).toHaveBeenCalledWith('card-1', 'list-2', 1, 'user-1');
    expect(result).toBe(movedCard);
  });

  it('adds a label to a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1', labelId: 'label-1' };
    const card = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.addLabelToCard = jest.fn().mockResolvedValue(card);

    const result = await resolver.addLabelToCard(input, user);

    expect(cardsService.addLabelToCard).toHaveBeenCalledWith('card-1', 'label-1', 'user-1');
    expect(result).toBe(card);
  });

  it('removes a label from a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1', labelId: 'label-1' };
    const card = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.removeLabelFromCard = jest.fn().mockResolvedValue(card);

    const result = await resolver.removeLabelFromCard(input, user);

    expect(cardsService.removeLabelFromCard).toHaveBeenCalledWith('card-1', 'label-1', 'user-1');
    expect(result).toBe(card);
  });

  it('sets due date on a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1', dueDate: '2024-12-31T23:59:59Z' };
    const card = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      dueDate: new Date('2024-12-31T23:59:59Z'),
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.setCardDueDate = jest.fn().mockResolvedValue(card);

    const result = await resolver.setCardDueDate(input, user);

    expect(cardsService.setCardDueDate).toHaveBeenCalledWith(
      'card-1',
      new Date('2024-12-31T23:59:59Z'),
      'user-1'
    );
    expect(result).toBe(card);
  });

  it('clears due date on a card for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { cardId: 'card-1' };
    const card = {
      id: 'card-1',
      title: 'My Card',
      description: null,
      position: 0,
      dueDate: null,
      listId: 'list-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cardsService.clearCardDueDate = jest.fn().mockResolvedValue(card);

    const result = await resolver.clearCardDueDate(input, user);

    expect(cardsService.clearCardDueDate).toHaveBeenCalledWith('card-1', 'user-1');
    expect(result).toBe(card);
  });
});

