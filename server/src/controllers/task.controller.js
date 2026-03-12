import { Task } from '../models/task.model.js';
import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import { Tag } from '../models/tag.model.js';
import mongoose from 'mongoose';

// Check if a user is an owner or admin of the board's workspace
async function isWsOwnerOrAdmin(board, userId) {
  const workspace = await Workspace.findById(board.workspaceId);
  if (!workspace) return false;
  const member = workspace.members.find((m) => {
    const mid = m.user?._id ?? m.user;
    return mid?.toString() === userId.toString();
  });
  return member && (member.role === 'owner' || member.role === 'admin');
}

// Check if a user has write access to a board (either as board creator, member with write role, or workspace owner/admin)
async function checkBoardWriteAccess(board, userId) {
  // Check if user is the board creator
  if (board.createdBy.toString() === userId.toString()) {
    return true;
  }
  // Check if user is a board member with write role
  const member = board.members.find((m) => m.userId.toString() === userId.toString());
  if (member && member.role === 'write') {
    return true;
  }
  // Check if user is a workspace owner or admin
  return await isWsOwnerOrAdmin(board, userId);
}

// Check if a user has read access to a board (either as board member or workspace owner/admin)
async function checkBoardReadAccess(board, userId) {
  // Check if user is the board creator or a board member
  const isMember =
    board.members.some((m) => m.userId.toString() === userId.toString()) ||
    board.createdBy.toString() === userId.toString();

  if (isMember) {
    return true;
  }

  // Check if user is a workspace owner or admin
  return await isWsOwnerOrAdmin(board, userId);
}

const createTask = async (req, res) => {
  try {
    const { title, description, boardId, assignedTo, status, priority, dueDate, tags } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({ message: 'Title and boardId are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    const hasWriteAccess = await checkBoardWriteAccess(board, req.user._id);
    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to create tasks on this board" });
    }

    // Verify assignedTo contains only board members if provided
    let validAssignees = [];
    if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
      const invalidAssignees = assignedTo.filter((assigneeId) => {
        const isMember =
          board.members.some((m) => m.userId.toString() === assigneeId.toString()) ||
          board.createdBy.toString() === assigneeId.toString();
        return !isMember;
      });

      if (invalidAssignees.length > 0) {
        return res
          .status(400)
          .json({ message: 'One or more assigned users are not members of this board' });
      }
      validAssignees = assignedTo;
    }

    let validTags = [];
    if (Array.isArray(tags) && tags.length > 0) {
      const dbTags = await Tag.find({
        _id: { $in: tags },
        $or: [{ boardId: null }, { boardId: new mongoose.Types.ObjectId(boardId) }],
      });
      validTags = dbTags.map((tag) => tag._id.toString());
    }

    const task = await Task.create({
      title,
      description,
      boardId,
      createdBy: req.user._id,
      assignedTo: validAssignees,
      status: status || 'todo',
      priority: priority || 'low',
      dueDate,
      tags: validTags,
    });

    await task.populate('assignedTo', 'fullName username avatar');
    await task.populate('createdBy', 'fullName username avatar');
    await task.populate('tags');

    return res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTasksByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const {
      status,
      limit = 10,
      cursor,
      cursorOrder: cursorOrderParam,
      cursorId: cursorIdParam,
    } = req.query;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check read permission — board member or workspace owner/admin
    const hasReadAccess = await checkBoardReadAccess(board, req.user._id);
    if (!hasReadAccess) {
      return res
        .status(403)
        .json({ message: "You don't have access to view tasks on this board" });
    }

    // Build query with filters
    const query = { boardId };

    // Filter by status if provided
    if (status) {
      const validStatuses = ['todo', 'in-progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status parameter' });
      }
      query.status = status;
    }

    // Cursor-based pagination using a compound cursor: (order, _id)
    let cursorOrder =
      cursorOrderParam !== undefined && cursorOrderParam !== ''
        ? Number(cursorOrderParam)
        : undefined;
    let resolvedCursorId = cursorIdParam || undefined;

    // Accept encoded cursor form: "<order>:<id>" for backward-compatible client pagination.
    if (cursor && !resolvedCursorId && (cursorOrder === undefined || Number.isNaN(cursorOrder))) {
      const encodedCursor = String(cursor);
      const separatorIndex = encodedCursor.indexOf(':');

      if (separatorIndex > -1) {
        const derivedOrder = Number(encodedCursor.slice(0, separatorIndex));
        const derivedId = encodedCursor.slice(separatorIndex + 1);

        if (!Number.isNaN(derivedOrder)) {
          cursorOrder = derivedOrder;
          resolvedCursorId = derivedId;
        }
      }
    }

    // Support legacy cursor (id only) by deriving order from the cursor task.
    if (cursor && !resolvedCursorId) {
      resolvedCursorId = String(cursor);
    }

    if (resolvedCursorId && (cursorOrder === undefined || Number.isNaN(cursorOrder))) {
      if (!mongoose.Types.ObjectId.isValid(resolvedCursorId)) {
        return res.status(400).json({ message: 'Invalid cursorId' });
      }

      const cursorQuery = { _id: resolvedCursorId, boardId };
      if (status) cursorQuery.status = status;

      const cursorTask = await Task.findOne(cursorQuery).select('order');
      if (!cursorTask) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      cursorOrder = cursorTask.order;
    }

    if (resolvedCursorId && cursorOrder !== undefined && !Number.isNaN(cursorOrder)) {
      if (!mongoose.Types.ObjectId.isValid(resolvedCursorId)) {
        return res.status(400).json({ message: 'Invalid cursorId' });
      }
      const cursorObjectId = new mongoose.Types.ObjectId(resolvedCursorId);
      query.$or = [
        { order: { $gt: cursorOrder } },
        { order: cursorOrder, _id: { $gt: cursorObjectId } },
      ];
    }

    // Parse limit to number and constrain it
    let limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum <= 0) limitNum = 10;
    if (limitNum > 100) limitNum = 100;
    // Fetch one extra to determine if there are more results
    const fetchLimit = limitNum + 1;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'fullName username avatar')
      .populate('createdBy', 'fullName username avatar')
      .populate('tags')
      .sort({ order: 1, _id: 1 })
      .limit(fetchLimit);

    // Determine if there are more results
    const hasMore = tasks.length > limitNum;
    const resultTasks = hasMore ? tasks.slice(0, limitNum) : tasks;

    // Encode next cursor as "<order>:<id>" so the next request can reuse both cursor fields.
    const nextCursor =
      resultTasks.length > 0
        ? `${resultTasks[resultTasks.length - 1].order}:${resultTasks[resultTasks.length - 1]._id.toString()}`
        : null;

    return res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks: resultTasks,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    const hasWriteAccess = await checkBoardWriteAccess(board, req.user._id);
    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to update tasks on this board" });
    }

    // Verify assignedTo contains only board members if provided/changed
    if (assignedTo !== undefined) {
      if (Array.isArray(assignedTo)) {
        const invalidAssignees = assignedTo.filter((assigneeId) => {
          const isMember =
            board.members.some((m) => m.userId.toString() === assigneeId.toString()) ||
            board.createdBy.toString() === assigneeId.toString();
          return !isMember;
        });

        if (invalidAssignees.length > 0) {
          return res
            .status(400)
            .json({ message: 'One or more assigned users are not members of this board' });
        }
        task.assignedTo = assignedTo;
      } else {
        task.assignedTo = [];
      }
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) {
      if (Array.isArray(tags) && tags.length > 0) {
        const dbTags = await Tag.find({
          _id: { $in: tags },
          $or: [{ boardId: null }, { boardId: new mongoose.Types.ObjectId(task.boardId) }],
        });
        task.tags = dbTags.map((t) => t._id.toString());
      } else {
        task.tags = [];
      }
    }

    await task.save();

    await task.populate('assignedTo', 'fullName username avatar');
    await task.populate('createdBy', 'fullName username avatar');
    await task.populate('tags');

    return res.status(200).json({
      message: 'Task updated successfully',
      task,
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
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    const hasWriteAccess = await checkBoardWriteAccess(board, req.user._id);
    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to delete tasks on this board" });
    }

    await task.deleteOne();

    return res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const reorderTasks = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { tasks } = req.body; // Array of { _id, status, order }

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Invalid tasks data' });
    }

    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    const taskIds = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t || !t._id || (typeof t._id !== 'string' && typeof t._id !== 'object')) {
        return res.status(400).json({ message: `Invalid _id at index ${i}` });
      }
      if (!validStatuses.includes(t.status)) {
        return res.status(400).json({ message: `Invalid status at index ${i}` });
      }
      if (typeof t.order !== 'number') {
        return res.status(400).json({ message: `Invalid order at index ${i}` });
      }
      taskIds.push(t._id);
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check write permission — board-level or workspace owner/admin
    const hasWriteAccess = await checkBoardWriteAccess(board, req.user._id);
    if (!hasWriteAccess) {
      return res
        .status(403)
        .json({ message: "You don't have write permission to reorder tasks on this board" });
    }

    if (taskIds.length > 0) {
      const uniqueIds = [...new Set(taskIds)];
      const matchedCount = await Task.countDocuments({ _id: { $in: uniqueIds }, boardId });
      if (matchedCount !== uniqueIds.length) {
        return res
          .status(422)
          .json({ message: 'One or more invalid task IDs or tasks do not belong to this board' });
      }
    }

    // Prepare bulk write operations
    const bulkOps = tasks.map((task) => ({
      updateOne: {
        filter: { _id: task._id, boardId },
        update: {
          $set: {
            status: task.status,
            order: task.order,
          },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { createTask, getTasksByBoard, updateTask, deleteTask, reorderTasks };
