import { User } from '@prisma/client';
import { WorkspacesResolver } from './workspaces.resolver';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesResolver', () => {
  const workspacesService = {
    createWorkspace: jest.fn(),
    myWorkspaces: jest.fn(),
    updateWorkspace: jest.fn(),
  } as unknown as WorkspacesService;
  const resolver = new WorkspacesResolver(workspacesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a workspace for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { name: 'Acme' };
    workspacesService.createWorkspace = jest.fn().mockResolvedValue({ id: 'workspace-1' });

    await resolver.createWorkspace(input, user);

    expect(workspacesService.createWorkspace).toHaveBeenCalledWith('user-1', 'Acme');
  });
  it('returns workspaces for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const memberships = [
      { workspace: { id: 'workspace-1' } },
      { workspace: { id: 'workspace-2' } },
    ];
    workspacesService.myWorkspaces = jest.fn().mockResolvedValue(memberships);

    const result = await resolver.myWorkspaces(user);

    expect(workspacesService.myWorkspaces).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([{ id: 'workspace-1' }, { id: 'workspace-2' }]);
  });

  it('updates workspace for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { id: 'workspace-1', name: 'Updated Acme' };
    const updatedWorkspace = { id: 'workspace-1', name: 'Updated Acme' };
    workspacesService.updateWorkspace = jest.fn().mockResolvedValue(updatedWorkspace);

    const result = await resolver.updateWorkspace(input, user);

    expect(workspacesService.updateWorkspace).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      'Updated Acme'
    );
    expect(result).toBe(updatedWorkspace);
  });
});

