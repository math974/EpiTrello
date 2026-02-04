import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { ListModel } from './list.model';

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

  @Field(() => ID)
  listId!: string;

  @Field(() => ListModel, { nullable: true })
  list?: ListModel | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

