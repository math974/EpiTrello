import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { CreateLabelInput } from './dto/create-label.input';
import { UpdateLabelInput } from './dto/update-label.input';
import { LabelModel } from './models/label.model';
import { LabelsService } from './labels.service';

@Resolver(() => LabelModel)
export class LabelsResolver {
  constructor(private readonly labelsService: LabelsService) {}

  @Mutation(() => LabelModel)
  @AuthGuard()
  async createLabel(
    @Args('input', { type: () => CreateLabelInput }) input: CreateLabelInput,
    @Context('user') user: User
  ) {
    return this.labelsService.createLabel(input.workspaceId, input.name, input.color, user.id);
  }

  @Mutation(() => LabelModel)
  @AuthGuard()
  async updateLabel(
    @Args('input', { type: () => UpdateLabelInput }) input: UpdateLabelInput,
    @Context('user') user: User
  ) {
    return this.labelsService.updateLabel(input.id, user.id, input.name, input.color);
  }

  @Mutation(() => Boolean)
  @AuthGuard()
  async deleteLabel(@Args('id') id: string, @Context('user') user: User) {
    return this.labelsService.deleteLabel(id, user.id);
  }
}

