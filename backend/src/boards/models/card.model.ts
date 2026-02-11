import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ListModel } from './list.model';
import { ChecklistModel } from '../../checklists/models/checklist.model';
import { UserModel } from '../../users/models/user.model';
import { AttachmentModel } from '../../attachments/models/attachment.model';
import { CommentModel } from '../../comments/models/comment.model';
import { LabelModel } from '../../labels/models/label.model';

@ObjectType()
export class CardModel {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  position!: number;

  @Field(() => Boolean)
  archived!: boolean;

  @Field(() => Int, { nullable: true })
  archivedPosition?: number | null;

  @Field(() => Date, { nullable: true })
  dueDate?: Date | null;

  @Field(() => Boolean)
  done!: boolean;

  @Field(() => ID)
  listId!: string;

  @Field(() => ListModel, { nullable: true })
  list?: ListModel | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [ChecklistModel], { nullable: true })
  checklists?: ChecklistModel[] | null;

  @Field(() => [UserModel], { nullable: true })
  assignees?: UserModel[] | null;

  @Field(() => [AttachmentModel], { nullable: true })
  attachments?: AttachmentModel[] | null;

  @Field(() => [CommentModel], { nullable: true })
  comments?: CommentModel[] | null;

  @Field(() => [LabelModel], { nullable: true })
  labels?: LabelModel[] | null;
}

