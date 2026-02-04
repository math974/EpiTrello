import { User } from '@prisma/client';
import { LabelsResolver } from './labels.resolver';
import { LabelsService } from './labels.service';

describe('LabelsResolver', () => {
  const labelsService = {
    createLabel: jest.fn(),
    updateLabel: jest.fn(),
    deleteLabel: jest.fn(),
  } as unknown as LabelsService;
  const resolver = new LabelsResolver(labelsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a label for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { workspaceId: 'workspace-1', name: 'Bug', color: '#ff0000' };
    const label = {
      id: 'label-1',
      name: 'Bug',
      color: '#ff0000',
      workspaceId: 'workspace-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    labelsService.createLabel = jest.fn().mockResolvedValue(label);

    const result = await resolver.createLabel(input, user);

    expect(labelsService.createLabel).toHaveBeenCalledWith(
      'workspace-1',
      'Bug',
      '#ff0000',
      'user-1'
    );
    expect(result).toBe(label);
  });

  it('updates a label for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'label-1', name: 'Updated Name', color: '#00ff00' };
    const updatedLabel = {
      id: 'label-1',
      name: 'Updated Name',
      color: '#00ff00',
      workspaceId: 'workspace-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    labelsService.updateLabel = jest.fn().mockResolvedValue(updatedLabel);

    const result = await resolver.updateLabel(input, user);

    expect(labelsService.updateLabel).toHaveBeenCalledWith(
      'label-1',
      'user-1',
      'Updated Name',
      '#00ff00'
    );
    expect(result).toBe(updatedLabel);
  });

  it('updates a label with only name for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'label-1', name: 'Updated Name' };
    const updatedLabel = {
      id: 'label-1',
      name: 'Updated Name',
      color: '#ff0000',
      workspaceId: 'workspace-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    labelsService.updateLabel = jest.fn().mockResolvedValue(updatedLabel);

    const result = await resolver.updateLabel(input, user);

    expect(labelsService.updateLabel).toHaveBeenCalledWith(
      'label-1',
      'user-1',
      'Updated Name',
      undefined
    );
    expect(result).toBe(updatedLabel);
  });

  it('updates a label with only color for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'label-1', color: '#00ff00' };
    const updatedLabel = {
      id: 'label-1',
      name: 'Bug',
      color: '#00ff00',
      workspaceId: 'workspace-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    labelsService.updateLabel = jest.fn().mockResolvedValue(updatedLabel);

    const result = await resolver.updateLabel(input, user);

    expect(labelsService.updateLabel).toHaveBeenCalledWith('label-1', 'user-1', undefined, '#00ff00');
    expect(result).toBe(updatedLabel);
  });

  it('deletes a label for the current user', async () => {
    const user = { id: 'user-1' } as User;
    labelsService.deleteLabel = jest.fn().mockResolvedValue(true);

    const result = await resolver.deleteLabel('label-1', user);

    expect(labelsService.deleteLabel).toHaveBeenCalledWith('label-1', 'user-1');
    expect(result).toBe(true);
  });
});

