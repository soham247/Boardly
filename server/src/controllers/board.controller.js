import { Board } from '../models/board.model.js';
import { Workspace } from '../models/workspace.model.js';
import mongoose from 'mongoose';

const createBoard = async (req, res) => {
  try {
    const { name, description, workspaceId, members } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'Name and workspaceId are required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is a workspace member
    const wsMember = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!wsMember) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    // Only owner and admin can create boards
    if (!['owner', 'admin'].includes(wsMember.role)) {
      return res.status(403).json({ message: 'Only owner or admin can create boards' });
    }

    // Enforce board tier limits
    if (req.user.tier === 'Free') {
      const boardCount = await Board.countDocuments({ workspaceId });
      if (boardCount >= 3) {
        return res
          .status(403)
          .json({ message: 'Free tier users can only create 3 boards per workspace.' });
      }
    }

    // Process incoming members
    const boardMembers = [];
    let isWorkspaceUpdated = false;

    if (members && Array.isArray(members)) {
      members.forEach((m) => {
        if (m.userId) {
          boardMembers.push({
            userId: m.userId,
            role: m.role || 'read',
          });

          // If user not yet in workspace, add as shared member
          const alreadyInWs = workspace.members.some(
            (wm) => wm.user.toString() === m.userId.toString()
          );
          if (!alreadyInWs) {
            workspace.members.push({ user: m.userId, role: 'shared' });
            isWorkspaceUpdated = true;
          }
        }
      });
    }

    if (isWorkspaceUpdated) {
      await workspace.save();
    }

    const creatorExists = boardMembers.find((m) => m.userId.toString() === req.user._id.toString());
    if (!creatorExists) {
      boardMembers.push({ userId: req.user._id, role: 'write' });
    } else {
      creatorExists.role = 'write';
    }

    const board = await Board.create({
      name,
      description,
      workspaceId,
      createdBy: req.user._id,
      members: boardMembers,
    });

    return res.status(201).json({
      message: 'Board created successfully',
      board,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBoards = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const wsMember = workspace.members.find((m) => {
      const mid = m.user?._id ?? m.user;
      return mid?.toString() === userId.toString();
    });
    if (!wsMember) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    // Owner/Admin see ALL boards; shared members see only boards they belong to
    const matchFilter = {
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    };
    if (wsMember.role === 'shared') {
      matchFilter['members.userId'] = userId;
    }

    const boards = await Board.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          userRole: {
            $cond: {
              if: { $eq: ['$createdBy', userId] },
              then: 'owner',
              else: {
                $let: {
                  vars: {
                    matchedMember: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$members',
                            as: 'm',
                            cond: { $eq: ['$$m.userId', userId] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: { $ifNull: ['$$matchedMember.role', 'write'] },
                },
              },
            },
          },
        },
      },
    ]);

    await Board.populate(boards, { path: 'members.userId', select: 'fullName username avatar' });

    return res.status(200).json({
      message: 'Boards fetched successfully',
      boards,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    const boards = await Board.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $addFields: {
          userRole: {
            $cond: {
              if: { $eq: ['$createdBy', req.user._id] },
              then: 'owner',
              else: {
                $let: {
                  vars: {
                    matchedMember: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$members',
                            as: 'm',
                            cond: { $eq: ['$$m.userId', req.user._id] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: { $ifNull: ['$$matchedMember.role', 'write'] },
                },
              },
            },
          },
        },
      },
    ]);

    if (boards.length === 0) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const board = boards[0];

    // Check board-level membership first
    const isBoardMember = board.members.some(
      (member) => member.userId.toString() === req.user._id.toString()
    );

    // If not a direct board member, check if they're a workspace owner/admin
    if (!isBoardMember) {
      const workspace = await Workspace.findById(board.workspaceId);
      const wsMember = workspace?.members.find((m) => {
        const mid = m.user?._id ?? m.user;
        return mid?.toString() === req.user._id.toString();
      });
      const isWsAdminOrOwner = wsMember && (wsMember.role === 'owner' || wsMember.role === 'admin');
      if (!isWsAdminOrOwner) {
        return res.status(403).json({ message: "You don't have access to this board" });
      }
      // Workspace owner/admin gets write access
      board.userRole = 'write';
    }

    await Board.populate(board, { path: 'members.userId', select: 'fullName username avatar' });

    return res.status(200).json({
      message: 'Board fetched successfully',
      board,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, members } = req.body;

    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const member = board.members.find((m) => m.userId.toString() === req.user._id.toString());
    const hasBoardWrite = member && member.role === 'write';

    // Fallback: workspace owner/admin always has write access
    let hasWriteAccess = hasBoardWrite || board.createdBy.toString() === req.user._id.toString();
    if (!hasWriteAccess) {
      const workspace = await Workspace.findById(board.workspaceId);
      const wsMember = workspace?.members.find((m) => {
        const mid = m.user?._id ?? m.user;
        return mid?.toString() === req.user._id.toString();
      });
      hasWriteAccess = wsMember && (wsMember.role === 'owner' || wsMember.role === 'admin');
    }

    if (!hasWriteAccess) {
      return res.status(403).json({ message: "You don't have write permission for this board" });
    }

    const isOwner = req.user._id.toString() === board.createdBy.toString();

    board.name = name || board.name;
    board.description = description !== undefined ? description : board.description;

    if (members && Array.isArray(members)) {
      const workspace = await Workspace.findById(board.workspaceId);
      let isWorkspaceUpdated = false;
      const boardMembers = [];

      if (!isOwner) {
        // Non-owners can edit anyone EXCEPT themselves and the owner.
        members.forEach((m) => {
          if (m.userId) {
            const mIdStr = m.userId.toString();
            if (mIdStr === req.user._id.toString()) {
              // Preserve self permission
              const originalSelf = board.members.find((om) => om.userId.toString() === mIdStr);
              if (originalSelf) m.role = originalSelf.role;
            } else if (mIdStr === board.createdBy.toString()) {
              // Preserve owner permission
              m.role = 'write';
            }

            boardMembers.push({ userId: m.userId, role: m.role || 'read' });

            // Add to workspace as shared member if not already present
            if (workspace && !workspace.members.some((wm) => wm.user.toString() === mIdStr)) {
              workspace.members.push({ user: m.userId, role: 'shared' });
              isWorkspaceUpdated = true;
            }
          }
        });

        // Ensure self is not completely deleted
        const selfExists = boardMembers.find(
          (m) => m.userId.toString() === req.user._id.toString()
        );
        if (!selfExists) {
          const originalSelf = board.members.find(
            (om) => om.userId.toString() === req.user._id.toString()
          );
          if (originalSelf)
            boardMembers.push({ userId: originalSelf.userId, role: originalSelf.role });
        }
      } else {
        members.forEach((m) => {
          if (m.userId) {
            boardMembers.push({
              userId: m.userId,
              role: m.role || 'read',
            });

            if (
              workspace &&
              !workspace.members.some((wm) => wm.user.toString() === m.userId.toString())
            ) {
              workspace.members.push({ user: m.userId, role: 'shared' });
              isWorkspaceUpdated = true;
            }
          }
        });
      }

      const creatorExists = boardMembers.find(
        (m) => m.userId.toString() === board.createdBy.toString()
      );
      if (!creatorExists) {
        boardMembers.push({ userId: board.createdBy, role: 'write' });
      } else {
        creatorExists.role = 'write';
      }

      board.members = boardMembers;

      if (isWorkspaceUpdated && workspace) {
        await workspace.save();
      }
    }

    await board.save();

    return res.status(200).json({
      message: 'Board updated successfully',
      board,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the board creator can delete it' });
    }

    await board.deleteOne();

    return res.status(200).json({
      message: 'Board deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { createBoard, getBoards, getBoardById, updateBoard, deleteBoard };
