import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from './models/activity-type.enum';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    activity: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    prisma = module.get<PrismaService>(PrismaService);
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
});

