import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateWorkspaceInput } from './dto/create-workspace.input';
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
}

