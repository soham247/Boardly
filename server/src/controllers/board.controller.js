import { Board } from "../models/board.model.js";
import { Workspace } from "../models/workspace.model.js";

const createBoard = async (req, res) => {
    try {
        const { name, description, workspaceId, members } = req.body;

        if (!name || !workspaceId) {
            return res.status(400).json({ message: "Name and workspaceId are required" });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Check if user is a member of the workspace
        if (!workspace.members.includes(req.user._id)) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        // Process incoming members
        let boardMembers = [];
        let isWorkspaceUpdated = false;

        if (members && Array.isArray(members)) {
            members.forEach(m => {
                if (m.userId) {
                    boardMembers.push({
                        userId: m.userId,
                        role: m.role || "read"
                    });

                    if (!workspace.members.includes(m.userId)) {
                        workspace.members.push(m.userId);
                        isWorkspaceUpdated = true;
                    }
                }
            });
        }

        if (isWorkspaceUpdated) {
            await workspace.save();
        }

        const creatorExists = boardMembers.find(m => m.userId.toString() === req.user._id.toString());
        if (!creatorExists) {
            boardMembers.push({ userId: req.user._id, role: "write" });
        } else {
            creatorExists.role = "write";
        }

        const board = await Board.create({
            name,
            description,
            workspaceId,
            createdBy: req.user._id,
            members: boardMembers
        });

        return res.status(201).json({
            message: "Board created successfully",
            board
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getBoards = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (!workspace.members.includes(req.user._id)) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        const boards = await Board.find({
            workspaceId,
            'members.userId': req.user._id
        }).populate('members.userId', 'fullName username avatar');

        return res.status(200).json({
            message: "Boards fetched successfully",
            boards
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getBoardById = async (req, res) => {
    try {
        const { id } = req.params;

        const board = await Board.findById(id).populate('members.userId', 'fullName username avatar');

        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const isMember = board.members.some(member => member.userId._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: "You don't have access to this board" });
        }

        return res.status(200).json({
            message: "Board fetched successfully",
            board
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
            return res.status(404).json({ message: "Board not found" });
        }

        const member = board.members.find(m => m.userId.toString() === req.user._id.toString());

        if (!member || member.role !== "write") {
            return res.status(403).json({ message: "You don't have write permission for this board" });
        }

        board.name = name || board.name;
        board.description = description !== undefined ? description : board.description;

        if (members && Array.isArray(members)) {
            const workspace = await Workspace.findById(board.workspaceId);
            let isWorkspaceUpdated = false;
            let boardMembers = [];

            members.forEach(m => {
                if (m.userId) {
                    boardMembers.push({
                        userId: m.userId,
                        role: m.role || "read"
                    });

                    if (workspace && !workspace.members.includes(m.userId)) {
                        workspace.members.push(m.userId);
                        isWorkspaceUpdated = true;
                    }
                }
            });

            const creatorExists = boardMembers.find(m => m.userId.toString() === board.createdBy.toString());
            if (!creatorExists) {
                boardMembers.push({ userId: board.createdBy, role: "write" });
            } else {
                creatorExists.role = "write";
            }

            board.members = boardMembers;

            if (isWorkspaceUpdated && workspace) {
                await workspace.save();
            }
        }

        await board.save();

        return res.status(200).json({
            message: "Board updated successfully",
            board
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
            return res.status(404).json({ message: "Board not found" });
        }

        if (board.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the board creator can delete it" });
        }

        await board.deleteOne();

        return res.status(200).json({
            message: "Board deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard
};
