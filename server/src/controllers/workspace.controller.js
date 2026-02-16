import { Workspace } from "../models/workspace.model.js";
import { User } from "../models/user.model.js";

const createWorkspace = async (req, res) => {
    try {
        const { name, slug } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: "Name and slug are required" });
        }

        const existedWorkspace = await Workspace.findOne({ slug });

        if (existedWorkspace) {
            return res.status(409).json({ message: "Workspace with this slug already exists" });
        }

        // Check workspace limit for Free tier
        const userWorkspacesCount = await Workspace.countDocuments({ owner: req.user._id });
        if (req.user.tier === "Free" && userWorkspacesCount >= 1) {
            return res.status(403).json({ message: "Free tier users can only create 1 workspace" });
        }

        const workspace = await Workspace.create({
            name,
            slug,
            owner: req.user._id,
            members: [req.user._id]
        });

        return res.status(201).json({
            message: "Workspace created successfully",
            workspace
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({
            members: req.user._id
        });

        return res.status(200).json({
            message: "Workspaces fetched successfully",
            workspaces
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only owner can update workspace" });
        }

        workspace.name = name || workspace.name;
        await workspace.save();

        return res.status(200).json({
            message: "Workspace updated successfully",
            workspace
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteWorkspace = async (req, res) => {
    try {
        const { id } = req.params;

        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only owner can delete workspace" });
        }

        await workspace.deleteOne();

        return res.status(200).json({
            message: "Workspace deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberId } = req.body;

        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only owner can add members" });
        }

        if (req.user.tier === "Free") {
            return res.status(403).json({ message: "Free tier users cannot add members" });
        }

        if (workspace.members.includes(memberId)) {
            return res.status(409).json({ message: "User is already a member" });
        }

        workspace.members.push(memberId);
        await workspace.save();

        return res.status(200).json({
            message: "Member added successfully",
            workspace
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;

        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if (workspace.owner.toString() !== req.user._id.toString() && memberId !== req.user._id.toString()) {
            // Only owner can remove others, but members can leave (remove themselves)
            return res.status(403).json({ message: "You don't have permission to remove this member" });
        }

        if (workspace.owner.toString() === memberId) {
            return res.status(400).json({ message: "Owner cannot be removed from workspace" });
        }

        workspace.members = workspace.members.filter(member => member.toString() !== memberId);
        await workspace.save();

        return res.status(200).json({
            message: "Member removed successfully",
            workspace
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export {
    createWorkspace,
    getWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember
};
