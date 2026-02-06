import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChecklistItemModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  checklistId!: string;

  @Field()
  content!: string;

  @Field()
  checked!: boolean;

  @Field(() => Int)
  position!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

