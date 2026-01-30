import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const prisma = {
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

  it('rejects access when user is not a workspace member', async () => {
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.getWorkspace('user-1', 'workspace-1')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns workspace details when user is a member', async () => {
    const workspace = { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' };
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({ userId: 'user-1' });
    prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
    prisma.workspaceMember.findMany = jest
      .fn()
      .mockResolvedValue([{ userId: 'user-1', workspaceId: 'workspace-1' }]);

    const result = await service.getWorkspace('user-1', 'workspace-1');

    expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
      where: { userId_workspaceId: { userId: 'user-1', workspaceId: 'workspace-1' } },
    });
    expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
      include: { owner: true },
    });
    expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-1' },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });
    expect(result).toEqual({
      ...workspace,
      members: [{ userId: 'user-1', workspaceId: 'workspace-1' }],
      boards: [],
    });
  });
});

