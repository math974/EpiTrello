import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const prisma = {
    workspace: {
      create: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new WorkspacesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a workspace with an owner membership', async () => {
    const workspace = {
      id: 'workspace-1',
      name: 'Acme',
      ownerId: 'user-1',
      owner: { id: 'user-1', username: 'Owner', email: 'owner@example.com' },
    };
    prisma.workspace.create = jest.fn().mockResolvedValue(workspace);

    const result = await service.createWorkspace('user-1', 'Acme');

    expect(prisma.workspace.create).toHaveBeenCalledWith({
      data: {
        name: 'Acme',
        ownerId: 'user-1',
        members: {
          create: {
            userId: 'user-1',
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        owner: true,
      },
    });
    expect(result).toBe(workspace);
  });
  it('returns workspaces where user is a member', async () => {
    const memberships = [
      { workspace: { id: 'workspace-1', name: 'Acme' } },
      { workspace: { id: 'workspace-2', name: 'Beta' } },
    ];
    prisma.workspaceMember.findMany = jest.fn().mockResolvedValue(memberships);

    const result = await service.myWorkspaces('user-1');

    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        workspace: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: {
        workspace: {
          createdAt: 'desc',
        },
      },
    });
    expect(result).toBe(memberships);
  });
});

