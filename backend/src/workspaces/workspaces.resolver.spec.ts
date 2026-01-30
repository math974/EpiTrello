import { User } from '@prisma/client';
import { WorkspacesResolver } from './workspaces.resolver';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesResolver', () => {
  const workspacesService = {
    createWorkspace: jest.fn(),
    myWorkspaces: jest.fn(),
    getWorkspace: jest.fn(),
    updateWorkspace: jest.fn(),
    addWorkspaceMember: jest.fn(),
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

  it('returns workspace details for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const workspace = { id: 'workspace-1', name: 'Acme' };
    workspacesService.getWorkspace = jest.fn().mockResolvedValue(workspace);

    const result = await resolver.workspace('workspace-1', user);

    expect(workspacesService.getWorkspace).toHaveBeenCalledWith('user-1', 'workspace-1');
    expect(result).toBe(workspace);
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

  it('adds a workspace member for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const input = { workspaceId: 'workspace-1', email: 'member@example.com' };
    const membership = {
      userId: 'user-2',
      workspaceId: 'workspace-1',
      role: 'MEMBER' as const,
    };
    workspacesService.addWorkspaceMember = jest.fn().mockResolvedValue(membership);

    const result = await resolver.addWorkspaceMember(input, user);

    expect(workspacesService.addWorkspaceMember).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      'member@example.com'
    );
    expect(result).toBe(membership);
  });
});

