import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { AddWorkspaceMemberInput } from './dto/add-workspace-member.input';
import { CreateWorkspaceInput } from './dto/create-workspace.input';
import { UpdateWorkspaceInput } from './dto/update-workspace.input';
import { WorkspaceMemberModel } from './models/workspace-member.model';
import { WorkspaceModel } from './models/workspace.model';
import { WorkspacesService } from './workspaces.service';

@Resolver(() => WorkspaceModel)
export class WorkspacesResolver {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Mutation(() => WorkspaceModel)
  @AuthGuard()
  createWorkspace(
    @Args('input', { type: () => CreateWorkspaceInput }) input: CreateWorkspaceInput,
    @Context('user') user: User
  ) {
    return this.workspacesService.createWorkspace(user.id, input.name);
  }

  @Query(() => [WorkspaceModel])
  @AuthGuard()
  async myWorkspaces(@Context('user') user: User) {
    const memberships = await this.workspacesService.myWorkspaces(user.id);
    return memberships.map((membership) => membership.workspace);
  }

  @Query(() => WorkspaceModel, { nullable: true })
  @AuthGuard()
  workspace(@Args('id') id: string, @Context('user') user: User) {
    return this.workspacesService.getWorkspace(user.id, id);
  }

  @Mutation(() => WorkspaceModel)
  @AuthGuard()
  async updateWorkspace(
    @Args('input', { type: () => UpdateWorkspaceInput }) input: UpdateWorkspaceInput,
    @Context('user') user: User
  ) {
    return this.workspacesService.updateWorkspace(input.id, user.id, input.name);
  }

  @Mutation(() => WorkspaceMemberModel)
  @AuthGuard()
  async addWorkspaceMember(
    @Args('input', { type: () => AddWorkspaceMemberInput }) input: AddWorkspaceMemberInput,
    @Context('user') user: User
  ) {
    return this.workspacesService.addWorkspaceMember(input.workspaceId, user.id, input.email);
  }
}

