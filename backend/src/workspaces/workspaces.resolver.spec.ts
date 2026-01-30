import { User } from '@prisma/client';
import { WorkspacesResolver } from './workspaces.resolver';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesResolver', () => {
  const workspacesService = {
    createWorkspace: jest.fn(),
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
});

