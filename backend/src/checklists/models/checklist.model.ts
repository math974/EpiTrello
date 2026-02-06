import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ChecklistItemModel } from './checklist-item.model';

@ObjectType()
export class ChecklistModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cardId!: string;

  @Field()
  title!: string;

  @Field(() => Int)
  position!: number;

  @Field(() => [ChecklistItemModel])
  items!: ChecklistItemModel[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}


