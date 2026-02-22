import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        boardId: {
            type: Schema.Types.ObjectId,
            ref: "Board",
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "review", "done"],
            default: "todo"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low"
        },
        dueDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export const Task = mongoose.model("Task", taskSchema);
