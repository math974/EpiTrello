import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async createLabel(workspaceId: string, name: string, color: string, userId: string) {
    // Validate workspaceId is provided
    if (!workspaceId || workspaceId.trim() === '') {
      throw new NotFoundException('Workspace ID is required');
    }

    // Validate name is provided
    if (!name || name.trim() === '') {
      throw new NotFoundException('Name is required');
    }

    // Validate color is provided
    if (!color || color.trim() === '') {
      throw new NotFoundException('Color is required');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(workspaceId, userId);

    // Create the label
    return this.prisma.label.create({
      data: {
        name: name.trim(),
        color: color.trim(),
        workspaceId,
      },
    });
  }

  async updateLabel(
    labelId: string,
    userId: string,
    name?: string | null,
    color?: string | null
  ) {
    // Validate labelId is provided
    if (!labelId || labelId.trim() === '') {
      throw new NotFoundException('Label ID is required');
    }

    // Find the label with its workspace
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: {
        workspace: true,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(label.workspaceId, userId);

    // Prepare update data
    const updateData: { name?: string; color?: string } = {};

    if (name !== undefined) {
      // If name is provided, validate it's not empty
      if (name !== null && name.trim() === '') {
        throw new NotFoundException('Name cannot be empty');
      }
      // Only include name if it's not null
      if (name !== null) {
        updateData.name = name.trim();
      }
    }

    if (color !== undefined) {
      // If color is provided, validate it's not empty
      if (color !== null && color.trim() === '') {
        throw new NotFoundException('Color cannot be empty');
      }
      // Only include color if it's not null
      if (color !== null) {
        updateData.color = color.trim();
      }
    }

    // If no fields to update, return the label as is
    if (Object.keys(updateData).length === 0) {
      return this.prisma.label.findUnique({
        where: { id: labelId },
      });
    }

    // Update the label
    return this.prisma.label.update({
      where: { id: labelId },
      data: updateData,
    });
  }

  async deleteLabel(labelId: string, userId: string) {
    // Validate labelId is provided
    if (!labelId || labelId.trim() === '') {
      throw new NotFoundException('Label ID is required');
    }

    // Find the label with its workspace
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: {
        workspace: true,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(label.workspaceId, userId);

    // Delete the label
    await this.prisma.label.delete({
      where: { id: labelId },
    });

    return true;
  }
}

