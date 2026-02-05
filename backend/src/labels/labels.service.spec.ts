import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LabelsService } from './labels.service';

describe('LabelsService', () => {
  const prisma = {
    label: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;
  const workspacesService = {
    requireWorkspaceAccess: jest.fn(),
  } as unknown as WorkspacesService;
  const activitiesService = {
    logActivity: jest.fn().mockResolvedValue(undefined),
  } as unknown as any;
  const service = new LabelsService(prisma, workspacesService, activitiesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLabel', () => {
    it('creates a label when user is a workspace member', async () => {
      const newLabel = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.label.create = jest.fn().mockResolvedValue(newLabel);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createLabel('workspace-1', 'Bug', '#ff0000', 'user-1');

      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.label.create).toHaveBeenCalledWith({
        data: {
          name: 'Bug',
          color: '#ff0000',
          workspaceId: 'workspace-1',
        },
      });
      expect(result).toBe(newLabel);
      expect(result.name).toBe('Bug');
      expect(result.color).toBe('#ff0000');
    });

    it('trims name and color whitespace when creating a label', async () => {
      const newLabel = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.label.create = jest.fn().mockResolvedValue(newLabel);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.createLabel('workspace-1', '  Bug  ', '  #ff0000  ', 'user-1');

      expect(prisma.label.create).toHaveBeenCalledWith({
        data: {
          name: 'Bug',
          color: '#ff0000',
          workspaceId: 'workspace-1',
        },
      });
      expect(result).toBe(newLabel);
    });

    it('throws NotFoundException when workspaceId is empty', async () => {
      await expect(service.createLabel('', 'Bug', '#ff0000', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when workspaceId is whitespace only', async () => {
      await expect(service.createLabel('   ', 'Bug', '#ff0000', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when name is empty', async () => {
      await expect(service.createLabel('workspace-1', '', '#ff0000', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when name is whitespace only', async () => {
      await expect(service.createLabel('workspace-1', '   ', '#ff0000', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when color is empty', async () => {
      await expect(service.createLabel('workspace-1', 'Bug', '', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when color is whitespace only', async () => {
      await expect(service.createLabel('workspace-1', 'Bug', '   ', 'user-1')).rejects.toThrow(
        NotFoundException
      );
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.create).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.createLabel('workspace-1', 'Bug', '#ff0000', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.label.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLabel', () => {
    it('updates a label name when user is a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Old Name',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedLabel = {
        id: 'label-1',
        name: 'New Name',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.label.findUnique = jest
        .fn()
        .mockResolvedValueOnce(labelWithWorkspace)
        .mockResolvedValueOnce(updatedLabel);
      prisma.label.update = jest.fn().mockResolvedValue(updatedLabel);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateLabel('label-1', 'user-1', 'New Name', undefined);

      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.label.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: {
          name: 'New Name',
        },
      });
      expect(result).toBe(updatedLabel);
      expect(result?.name).toBe('New Name');
    });

    it('updates a label color when user is a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedLabel = {
        id: 'label-1',
        name: 'Bug',
        color: '#00ff00',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.label.findUnique = jest
        .fn()
        .mockResolvedValueOnce(labelWithWorkspace)
        .mockResolvedValueOnce(updatedLabel);
      prisma.label.update = jest.fn().mockResolvedValue(updatedLabel);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateLabel('label-1', 'user-1', undefined, '#00ff00');

      expect(prisma.label.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: {
          color: '#00ff00',
        },
      });
      expect(result).toBe(updatedLabel);
      expect(result?.color).toBe('#00ff00');
    });

    it('updates both name and color when user is a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Old Name',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      const updatedLabel = {
        id: 'label-1',
        name: 'New Name',
        color: '#00ff00',
        workspaceId: 'workspace-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.label.findUnique = jest
        .fn()
        .mockResolvedValueOnce(labelWithWorkspace)
        .mockResolvedValueOnce(updatedLabel);
      prisma.label.update = jest.fn().mockResolvedValue(updatedLabel);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateLabel('label-1', 'user-1', 'New Name', '#00ff00');

      expect(prisma.label.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: {
          name: 'New Name',
          color: '#00ff00',
        },
      });
      expect(result).toBe(updatedLabel);
      expect(result?.name).toBe('New Name');
      expect(result?.color).toBe('#00ff00');
    });

    it('returns label as is when no fields are provided for update', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest
        .fn()
        .mockResolvedValueOnce(labelWithWorkspace)
        .mockResolvedValueOnce(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.updateLabel('label-1', 'user-1', undefined, undefined);

      expect(prisma.label.update).not.toHaveBeenCalled();
      expect(prisma.label.findUnique).toHaveBeenCalledTimes(2);
      expect(result).toBe(labelWithWorkspace);
    });

    it('throws NotFoundException when labelId is empty', async () => {
      await expect(service.updateLabel('', 'user-1', 'New Name', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when labelId is whitespace only', async () => {
      await expect(service.updateLabel('   ', 'user-1', 'New Name', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when name is empty string', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.updateLabel('label-1', 'user-1', '', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when color is empty string', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      await expect(service.updateLabel('label-1', 'user-1', undefined, '')).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when label does not exist', async () => {
      prisma.label.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateLabel('label-1', 'user-1', 'New Name', undefined)).rejects.toThrow(
        NotFoundException
      );
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.updateLabel('label-1', 'user-2', 'New Name', undefined)).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.label.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteLabel', () => {
    it('deletes a label when user is a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      prisma.label.delete = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1', role: 'MEMBER' },
      });

      const result = await service.deleteLabel('label-1', 'user-1');

      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-1'
      );
      expect(prisma.label.delete).toHaveBeenCalledWith({
        where: { id: 'label-1' },
      });
      expect(result).toBe(true);
    });

    it('throws NotFoundException when labelId is empty', async () => {
      await expect(service.deleteLabel('', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when labelId is whitespace only', async () => {
      await expect(service.deleteLabel('   ', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.label.findUnique).not.toHaveBeenCalled();
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when label does not exist', async () => {
      prisma.label.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteLabel('label-1', 'user-1')).rejects.toThrow(NotFoundException);
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).not.toHaveBeenCalled();
      expect(prisma.label.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      const labelWithWorkspace = {
        id: 'label-1',
        name: 'Bug',
        color: '#ff0000',
        workspaceId: 'workspace-1',
        workspace: { id: 'workspace-1', name: 'Acme', ownerId: 'user-1' },
      };
      prisma.label.findUnique = jest.fn().mockResolvedValue(labelWithWorkspace);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(service.deleteLabel('label-1', 'user-2')).rejects.toThrow(ForbiddenException);
      expect(prisma.label.findUnique).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        include: {
          workspace: true,
        },
      });
      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(
        'workspace-1',
        'user-2'
      );
      expect(prisma.label.delete).not.toHaveBeenCalled();
    });
  });
});

