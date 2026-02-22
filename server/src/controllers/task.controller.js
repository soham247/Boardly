import { Task } from "../models/task.model.js";
import { Board } from "../models/board.model.js";
import mongoose from "mongoose";

const createTask = async (req, res) => {
    try {
        const { title, description, boardId, assignedTo, status, priority, dueDate } = req.body;

        if (!title || !boardId) {
            return res.status(400).json({ message: "Title and boardId are required" });
        }

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        // Check write permission
        let hasWriteAccess = false;
        if (board.createdBy.toString() === req.user._id.toString()) {
            hasWriteAccess = true;
        } else {
            const member = board.members.find(m => m.userId.toString() === req.user._id.toString());
            if (member && member.role === "write") {
                hasWriteAccess = true;
            }
        }

        if (!hasWriteAccess) {
            return res.status(403).json({ message: "You don't have write permission to create tasks on this board" });
        }

        // Verify assignedTo is a board member if provided
        if (assignedTo) {
            const isMember = board.members.some(m => m.userId.toString() === assignedTo) || board.createdBy.toString() === assignedTo;
            if (!isMember) {
                return res.status(400).json({ message: "Assigned user is not a member of this board" });
            }
        }

        const task = await Task.create({
            title,
            description,
            boardId,
            createdBy: req.user._id,
            assignedTo,
            status: status || "todo",
            priority: priority || "low",
            dueDate
        });

        await task.populate('assignedTo', 'fullName username avatar');
        await task.populate('createdBy', 'fullName username avatar');

        return res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getTasksByBoard = async (req, res) => {
    try {
        const { boardId } = req.params;

        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        // Check read permission
        const isMember = board.members.some(m => m.userId.toString() === req.user._id.toString()) || board.createdBy.toString() === req.user._id.toString();

        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to view tasks on this board" });
        }

        const tasks = await Task.find({ boardId })
            .populate('assignedTo', 'fullName username avatar')
            .populate('createdBy', 'fullName username avatar')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            message: "Tasks fetched successfully",
            tasks
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, assignedTo, status, priority, dueDate } = req.body;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const board = await Board.findById(task.boardId);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        // Check write permission
        let hasWriteAccess = false;
        if (board.createdBy.toString() === req.user._id.toString()) {
            hasWriteAccess = true;
        } else {
            const member = board.members.find(m => m.userId.toString() === req.user._id.toString());
            if (member && member.role === "write") {
                hasWriteAccess = true;
            }
        }

        if (!hasWriteAccess) {
            return res.status(403).json({ message: "You don't have write permission to update tasks on this board" });
        }

        // Verify assignedTo is a board member if provided/changed
        if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
            const isMember = board.members.some(m => m.userId.toString() === assignedTo) || board.createdBy.toString() === assignedTo;
            if (!isMember) {
                return res.status(400).json({ message: "Assigned user is not a member of this board" });
            }
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;

        await task.save();

        await task.populate('assignedTo', 'fullName username avatar');
        await task.populate('createdBy', 'fullName username avatar');

        return res.status(200).json({
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const board = await Board.findById(task.boardId);
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        // Check write permission
        let hasWriteAccess = false;
        if (board.createdBy.toString() === req.user._id.toString()) {
            hasWriteAccess = true;
        } else {
            const member = board.members.find(m => m.userId.toString() === req.user._id.toString());
            if (member && member.role === "write") {
                hasWriteAccess = true;
            }
        }

        if (!hasWriteAccess) {
            return res.status(403).json({ message: "You don't have write permission to delete tasks on this board" });
        }

        await task.deleteOne();

        return res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    createTask,
    getTasksByBoard,
    updateTask,
    deleteTask
};
