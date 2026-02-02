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
      delete: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
    prisma.workspace.findUnique = jest.fn().mockResolvedValue({
      id: 'workspace-1',
      name: 'Acme',
      ownerId: 'owner-1',
    });
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.getWorkspace('user-1', 'workspace-1')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('returns workspace details when user is a member', async () => {
    const workspace = { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' };
    prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
    prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({ userId: 'user-1' });
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

  describe('requireWorkspaceAccess', () => {
    it('returns workspace and membership when user is a member', async () => {
      const workspace = { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' };
      const membership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);

      const result = await service.requireWorkspaceAccess('workspace-1', 'user-1');

      expect(result).toEqual({ workspace, membership });
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.requireWorkspaceAccess('workspace-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a member', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue({
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'owner-1',
      });
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.requireWorkspaceAccess('workspace-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('requireWorkspaceOwner', () => {
    it('returns workspace and membership when user is an owner', async () => {
      const workspace = { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' };
      const membership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);

      const result = await service.requireWorkspaceOwner('workspace-1', 'user-1');

      expect(result).toEqual({ workspace, membership });
    });

    it('throws ForbiddenException when user is not an owner', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue({
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      });
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.requireWorkspaceOwner('workspace-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.requireWorkspaceOwner('workspace-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateWorkspace', () => {
    it('updates workspace name when user is owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      });
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
      prisma.workspaceMember.findUnique = jest.fn();

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
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.updateWorkspace('workspace-1', 'user-1', 'New Name')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteWorkspace', () => {
    it('deletes workspace when user is owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      });
      prisma.workspace.delete = jest.fn().mockResolvedValue(workspace);

      const result = await service.deleteWorkspace('workspace-1', 'user-1');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);
      prisma.workspaceMember.findUnique = jest.fn();

      await expect(service.deleteWorkspace('workspace-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspace.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      });

      await expect(service.deleteWorkspace('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.workspace.delete).not.toHaveBeenCalled();
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
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce({
          userId: 'user-1',
          workspaceId: 'workspace-1',
          role: WorkspaceRole.OWNER,
        })
        .mockResolvedValueOnce(null);
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
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      });

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
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      });
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'notfound@example.com')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-1',
          },
        },
      });
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
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce({
          userId: 'user-1',
          workspaceId: 'workspace-1',
          role: WorkspaceRole.OWNER,
        })
        .mockResolvedValueOnce(existingMember);

      await expect(
        service.addWorkspaceMember('workspace-1', 'user-1', 'member@example.com')
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.workspaceMember.create).not.toHaveBeenCalled();
    });
  });

  describe('removeWorkspaceMember', () => {
    it('removes a member when owner removes them', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const ownerMembership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      const memberToRemove = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(memberToRemove);
      prisma.workspaceMember.delete = jest.fn().mockResolvedValue(memberToRemove);

      const result = await service.removeWorkspaceMember('workspace-1', 'user-1', 'user-2');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(result).toBe(true);
    });

    it('removes an owner when there are multiple owners', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const ownerMembership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      const ownerToRemove = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(ownerToRemove);
      prisma.workspaceMember.count = jest.fn().mockResolvedValue(2);
      prisma.workspaceMember.delete = jest.fn().mockResolvedValue(ownerToRemove);

      const result = await service.removeWorkspaceMember('workspace-1', 'user-1', 'user-2');

      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
      });
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.count).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
          role: WorkspaceRole.OWNER,
        },
      });
      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when workspace does not exist', async () => {
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(null);
      prisma.workspaceMember.findUnique = jest.fn();

      await expect(
        service.removeWorkspaceMember('workspace-1', 'user-1', 'user-2')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-2',
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      });

      await expect(
        service.removeWorkspaceMember('workspace-1', 'user-1', 'user-3')
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-1',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user is not a member', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const ownerMembership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(null);

      await expect(
        service.removeWorkspaceMember('workspace-1', 'user-1', 'user-2')
      ).rejects.toThrow(NotFoundException);
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when trying to remove the last owner', async () => {
      const workspace = {
        id: 'workspace-1',
        name: 'Acme',
        ownerId: 'user-1',
      };
      const ownerMembership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      const ownerToRemove = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspace.findUnique = jest.fn().mockResolvedValue(workspace);
      prisma.workspaceMember.findUnique = jest
        .fn()
        .mockResolvedValueOnce(ownerMembership)
        .mockResolvedValueOnce(ownerToRemove);
      prisma.workspaceMember.count = jest.fn().mockResolvedValue(1);

      await expect(
        service.removeWorkspaceMember('workspace-1', 'user-1', 'user-1')
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });
  });

  describe('leaveWorkspace', () => {
    it('allows a member to leave the workspace', async () => {
      const membership = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.MEMBER,
      };
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);
      prisma.workspaceMember.delete = jest.fn().mockResolvedValue(membership);

      const result = await service.leaveWorkspace('workspace-1', 'user-2');

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(result).toBe(true);
    });

    it('allows an owner to leave when there are multiple owners', async () => {
      const membership = {
        userId: 'user-2',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);
      prisma.workspaceMember.count = jest.fn().mockResolvedValue(2);
      prisma.workspaceMember.delete = jest.fn().mockResolvedValue(membership);

      const result = await service.leaveWorkspace('workspace-1', 'user-2');

      expect(prisma.workspaceMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(prisma.workspaceMember.count).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
          role: WorkspaceRole.OWNER,
        },
      });
      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: 'user-2',
            workspaceId: 'workspace-1',
          },
        },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when user is not a member', async () => {
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.leaveWorkspace('workspace-1', 'user-2')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when trying to leave as the last owner', async () => {
      const membership = {
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.OWNER,
      };
      prisma.workspaceMember.findUnique = jest.fn().mockResolvedValue(membership);
      prisma.workspaceMember.count = jest.fn().mockResolvedValue(1);

      await expect(service.leaveWorkspace('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.workspaceMember.delete).not.toHaveBeenCalled();
    });
  });
});

