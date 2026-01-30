import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const prisma = {
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
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

  describe('updateWorkspace', () => {
    it('updates workspace name when user is owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const updatedWorkspace = {
        ...workspace,
        name: 'Updated Acme',
        owner: { id: 'user-1', username: 'Owner', email: 'owner@example.com' },
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspace.update = jest.fn().mockResolvedValue(updatedWorkspace);

      const result = await service.updateWorkspace('workspace-1', 'user-1', 'Updated Acme');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
        data: { name: 'Updated Acme' },
        include: {
          owner: true,
        },
      });
      expect(result).toBe(updatedWorkspace);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateWorkspace('workspace-1', 'user-1', 'New Name')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);

      await expect(service.updateWorkspace('workspace-1', 'user-1', 'New Name')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });
  });

  describe('addWorkspaceMember', () => {
    it('adds a user as member when owner adds them', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const user = {
        id: 'user-2',
        email: 'member@example.com',
        username: 'Member',
      };
      const membership = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
        user,
        workspace,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.user.findUnique = jest.fn().mockResolvedValue(user);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);
      prisma.workspaceMember.create = jest.fn().mockResolvedValue(membership);

      const result = await service.addWorkspaceMember('workspace-1', 'user-1', 'member@example.com');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'member@example.com' },
      });
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          workspaceId: 'workspace-1',
          role: WorkspaceRole.MEMBER,
        },
        include: {
          user: true,
          workspace: true,
        },
      });
      expect(result).toBe(membership);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'member@example.com')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'member@example.com')
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user email not found', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'notfound@example.com')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is already a member', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const user = {
        id: 'user-2',
        email: 'member@example.com',
        username: 'Member',
      };
      const existingMember = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.user.findUnique = jest.fn().mockResolvedValue(user);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(existingMember);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'member@example.com')
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });
  });
});

