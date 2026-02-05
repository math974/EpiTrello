import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ActivityType } from './models/activity-type.enum';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: PrismaService;
  let workspacesService: WorkspacesService;

  const mockPrismaService = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockWorkspacesService = {
    requireWorkspaceAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = module.get<PrismaService>(PrismaService);
    workspacesService = module.get<WorkspacesService>(WorkspacesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('creates an activity successfully', async () => {
      const activityData = {
        workspaceId: 'workspace-1',
        boardId: 'board-1',
        actorId: 'user-1',
        type: ActivityType.CARD_CREATED,
        metadata: { cardId: 'card-1', title: 'My Card' },
      };

      const createdActivity = {
        id: 'activity-1',
        ...activityData,
        createdAt: new Date(),
        workspace: { id: 'workspace-1', name: 'Acme' },
        board: { id: 'board-1', title: 'My Board' },
        actor: { id: 'user-1', username: 'john' },
      };

      prisma.activity.create = jest.fn().mockResolvedValue(createdActivity);

      const result = await service.logActivity(activityData);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          workspaceId: activityData.workspaceId,
          boardId: activityData.boardId,
          actorId: activityData.actorId,
          type: activityData.type,
          metadata: activityData.metadata,
        },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
      expect(result).toBe(createdActivity);
    });

    it('creates an activity without boardId', async () => {
      const activityData = {
        workspaceId: 'workspace-1',
        actorId: 'user-1',
        type: ActivityType.WORKSPACE_CREATED,
        metadata: { name: 'Acme' },
      };

      const createdActivity = {
        id: 'activity-1',
        ...activityData,
        boardId: null,
        createdAt: new Date(),
        workspace: { id: 'workspace-1', name: 'Acme' },
        board: null,
        actor: { id: 'user-1', username: 'john' },
      };

      prisma.activity.create = jest.fn().mockResolvedValue(createdActivity);

      const result = await service.logActivity(activityData);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          workspaceId: activityData.workspaceId,
          boardId: null,
          actorId: activityData.actorId,
          type: activityData.type,
          metadata: activityData.metadata,
        },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
      expect(result).toBe(createdActivity);
    });

    it('creates an activity without metadata', async () => {
      const activityData = {
        workspaceId: 'workspace-1',
        boardId: 'board-1',
        actorId: 'user-1',
        type: ActivityType.CARD_DELETED,
      };

      const createdActivity = {
        id: 'activity-1',
        ...activityData,
        metadata: null,
        createdAt: new Date(),
        workspace: { id: 'workspace-1', name: 'Acme' },
        board: { id: 'board-1', title: 'My Board' },
        actor: { id: 'user-1', username: 'john' },
      };

      prisma.activity.create = jest.fn().mockResolvedValue(createdActivity);

      const result = await service.logActivity(activityData);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          workspaceId: activityData.workspaceId,
          boardId: activityData.boardId,
          actorId: activityData.actorId,
          type: activityData.type,
          // metadata is not included when undefined
        },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
      expect(result).toBe(createdActivity);
    });

    it('handles all activity types', async () => {
      const activityTypes = Object.values(ActivityType);

      for (const type of activityTypes) {
        const activityData = {
          workspaceId: 'workspace-1',
          boardId: 'board-1',
          actorId: 'user-1',
          type,
          metadata: { test: 'data' },
        };

        const createdActivity = {
          id: `activity-${type}`,
          ...activityData,
          createdAt: new Date(),
        };

        prisma.activity.create = jest.fn().mockResolvedValue(createdActivity);

        await service.logActivity(activityData);

        expect(prisma.activity.create).toHaveBeenCalledWith({
          data: {
            workspaceId: activityData.workspaceId,
            boardId: activityData.boardId,
            actorId: activityData.actorId,
            type,
            metadata: activityData.metadata,
          },
          include: {
            workspace: true,
            board: true,
            actor: true,
          },
        });
      }
    });
  });

  describe('getWorkspaceActivities', () => {
    const workspaceId = 'workspace-1';
    const userId = 'user-1';

    beforeEach(() => {
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: workspaceId, name: 'Acme' },
        membership: { userId, workspaceId, role: 'MEMBER' },
      });
    });

    it('returns activities for a workspace without cursor', async () => {
      const activities = [
        {
          id: 'activity-1',
          workspaceId,
          boardId: 'board-1',
          actorId: userId,
          type: ActivityType.CARD_CREATED,
          metadata: { cardId: 'card-1' },
          createdAt: new Date('2024-01-01T10:00:00Z'),
          workspace: { id: workspaceId, name: 'Acme' },
          board: { id: 'board-1', title: 'My Board' },
          actor: { id: userId, username: 'john' },
        },
        {
          id: 'activity-2',
          workspaceId,
          boardId: null,
          actorId: userId,
          type: ActivityType.WORKSPACE_CREATED,
          metadata: { name: 'Acme' },
          createdAt: new Date('2024-01-01T09:00:00Z'),
          workspace: { id: workspaceId, name: 'Acme' },
          board: null,
          actor: { id: userId, username: 'john' },
        },
      ];

      prisma.activity.findMany = jest.fn().mockResolvedValue(activities);

      const result = await service.getWorkspaceActivities(workspaceId, userId, 20);

      expect(workspacesService.requireWorkspaceAccess).toHaveBeenCalledWith(workspaceId, userId);
      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        take: 21,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
      expect(result.activities).toEqual(activities);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('returns activities with cursor pagination', async () => {
      const cursor = '2024-01-01T10:00:00Z';
      const activities = [
        {
          id: 'activity-2',
          workspaceId,
          boardId: null,
          actorId: userId,
          type: ActivityType.WORKSPACE_CREATED,
          metadata: { name: 'Acme' },
          createdAt: new Date('2024-01-01T09:00:00Z'),
          workspace: { id: workspaceId, name: 'Acme' },
          board: null,
          actor: { id: userId, username: 'john' },
        },
      ];

      prisma.activity.findMany = jest.fn().mockResolvedValue(activities);

      const result = await service.getWorkspaceActivities(workspaceId, userId, 20, cursor);

      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId,
          createdAt: { lt: new Date(cursor) },
        },
        take: 21,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
      expect(result.activities).toEqual(activities);
      expect(result.hasMore).toBe(false);
    });

    it('indicates hasMore when there are more activities', async () => {
      const baseDate = new Date('2024-01-01T10:00:00Z');
      const activities = Array.from({ length: 21 }, (_, i) => ({
        id: `activity-${i}`,
        workspaceId,
        boardId: null,
        actorId: userId,
        type: ActivityType.CARD_CREATED,
        metadata: null,
        createdAt: new Date(baseDate.getTime() - i * 60000), // Subtract i minutes
        workspace: { id: workspaceId, name: 'Acme' },
        board: null,
        actor: { id: userId, username: 'john' },
      }));

      prisma.activity.findMany = jest.fn().mockResolvedValue(activities);

      const result = await service.getWorkspaceActivities(workspaceId, userId, 20);

      expect(result.activities).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe(activities[19].createdAt.toISOString());
    });

    it('limits results to maximum 100', async () => {
      prisma.activity.findMany = jest.fn().mockResolvedValue([]);

      await service.getWorkspaceActivities(workspaceId, userId, 200);

      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        take: 101, // limit + 1
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
    });

    it('ensures minimum limit of 1', async () => {
      prisma.activity.findMany = jest.fn().mockResolvedValue([]);

      await service.getWorkspaceActivities(workspaceId, userId, 0);

      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        take: 2, // 1 + 1
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
    });

    it('ignores invalid cursor format', async () => {
      const invalidCursor = 'invalid-date';
      prisma.activity.findMany = jest.fn().mockResolvedValue([]);

      await service.getWorkspaceActivities(workspaceId, userId, 20, invalidCursor);

      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
        take: 21,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
          board: true,
          actor: true,
        },
      });
    });

    it('throws ForbiddenException when user is not a workspace member', async () => {
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new Error('Access denied')
      );

      await expect(
        service.getWorkspaceActivities(workspaceId, userId, 20)
      ).rejects.toThrow('Access denied');
      expect(prisma.activity.findMany).not.toHaveBeenCalled();
    });
  });
});

