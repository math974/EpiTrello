import { Schema, model, type InferSchemaType } from 'mongoose';

const boardSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    background: {
      type: String,
      default: '#0079bf',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

boardSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export type BoardDocument = InferSchemaType<typeof boardSchema>;

export const Board = model<BoardDocument>('Board', boardSchema);

