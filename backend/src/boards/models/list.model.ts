import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CardModel } from './card.model';

@ObjectType()
export class ListModel {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => Int)
  position!: number;

  @Field(() => ID)
  boardId!: string;

  @Field(() => [CardModel], { nullable: true })
  cards?: CardModel[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

