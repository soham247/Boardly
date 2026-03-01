import mongoose, { Schema } from 'mongoose';

const tagSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        color: {
            type: String,
            required: true,
            default: '#e2e8f0',
        },
        boardId: {
            type: Schema.Types.ObjectId,
            ref: 'Board',
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const Tag = mongoose.model('Tag', tagSchema);
