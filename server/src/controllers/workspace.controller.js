import { Workspace } from '../models/workspace.model.js';
import { Board } from '../models/board.model.js';
import { User } from '../models/user.model.js';

// ─── helpers ────────────────────────────────────────────────────────
function getMember(workspace, userId) {
  return workspace.members.find((m) => {
    // Handle both populated (m.user._id) and non-populated (m.user) cases
    const memberId = m.user?._id ?? m.user;
    return memberId?.toString() === userId.toString();
  });
}

function hasRole(workspace, userId, ...roles) {
  const member = getMember(workspace, userId);
  return member && roles.includes(member.role);
}

// ─── create ─────────────────────────────────────────────────────────
const createWorkspace = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    const existedWorkspace = await Workspace.findOne({ slug });

    if (existedWorkspace) {
      return res.status(409).json({ message: 'Workspace with this slug already exists' });
    }

    // Check workspace limit for Free tier
    const userWorkspacesCount = await Workspace.countDocuments({
      'members.user': req.user._id,
      'members.role': 'owner',
    });
    if (req.user.tier === 'Free' && userWorkspacesCount >= 1) {
      return res.status(403).json({ message: 'Free tier users can only create 1 workspace' });
    }

    const workspace = await Workspace.create({
      name,
      slug,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    return res.status(201).json({
      message: 'Workspace created successfully',
      workspace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── list ───────────────────────────────────────────────────────────
const getWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;

    const workspaces = await Workspace.find({ 'members.user': userId });

    // For "shared" members, only return workspace if they have ≥1 board membership
    const visibleWorkspaces = [];

    for (const ws of workspaces) {
      const member = getMember(ws, userId);
      if (!member) continue;

      if (member.role === 'owner' || member.role === 'admin') {
        visibleWorkspaces.push({ ...ws.toObject(), userRole: member.role });
      } else {
        // shared member — check if they belong to at least one board
        const boardCount = await Board.countDocuments({
          workspaceId: ws._id,
          'members.userId': userId,
        });
        if (boardCount > 0) {
          visibleWorkspaces.push({ ...ws.toObject(), userRole: member.role });
        }
      }
    }

    return res.status(200).json({
      message: 'Workspaces fetched successfully',
      workspaces: visibleWorkspaces,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── get by id ──────────────────────────────────────────────────────
const getWorkspaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).populate(
      'members.user',
      'fullName username avatar'
    );

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const member = getMember(workspace, req.user._id);
    if (!member) {
      return res.status(403).json({ message: "You don't have access to this workspace" });
    }

    return res.status(200).json({
      message: 'Workspace fetched successfully',
      workspace: { ...workspace.toObject(), userRole: member.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── update ─────────────────────────────────────────────────────────
const updateWorkspace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!hasRole(workspace, req.user._id, 'owner', 'admin')) {
      return res.status(403).json({ message: 'Only owner or admin can update workspace' });
    }

    workspace.name = name || workspace.name;
    await workspace.save();

    return res.status(200).json({
      message: 'Workspace updated successfully',
      workspace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── delete ─────────────────────────────────────────────────────────
const deleteWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!hasRole(workspace, req.user._id, 'owner')) {
      return res.status(403).json({ message: 'Only owner can delete workspace' });
    }

    await workspace.deleteOne();

    return res.status(200).json({
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── add member (admin only — shared is implicit via board sharing) ──
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!hasRole(workspace, req.user._id, 'owner', 'admin')) {
      return res.status(403).json({ message: 'Only owner or admin can add members' });
    }

    if (req.user.tier === 'Free') {
      return res.status(403).json({ message: 'Free tier users cannot add members' });
    }

    const userToAdd = await User.findById(memberId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existing = getMember(workspace, memberId);
    if (existing) {
      // If already a shared member, promote to admin
      if (existing.role === 'shared') {
        existing.role = 'admin';
        await workspace.save();
        return res.status(200).json({
          message: 'Member promoted to admin',
          workspace,
        });
      }
      return res.status(409).json({ message: 'User is already a member' });
    }

    // Explicit adds via this endpoint are always admin
    workspace.members.push({ user: memberId, role: 'admin' });
    await workspace.save();

    return res.status(200).json({
      message: 'Member added as admin',
      workspace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── remove member ──────────────────────────────────────────────────
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const requester = getMember(workspace, req.user._id);
    const target = getMember(workspace, memberId);

    if (!target) {
      return res.status(404).json({ message: 'Member not found in this workspace' });
    }

    // Owner cannot be removed
    if (target.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot be removed from workspace' });
    }

    const isSelfLeave = memberId === req.user._id.toString();

    if (!isSelfLeave) {
      // Must be owner or admin to remove others
      if (!requester || !['owner', 'admin'].includes(requester.role)) {
        return res.status(403).json({ message: "You don't have permission to remove this member" });
      }
      // Admins cannot remove other admins
      if (requester.role === 'admin' && target.role === 'admin') {
        return res.status(403).json({ message: 'Admins cannot remove other admins' });
      }
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== memberId);
    await workspace.save();

    return res.status(200).json({
      message: 'Member removed successfully',
      workspace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── update member role ─────────────────────────────────────────────
const updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'shared'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "admin" or "shared"' });
    }

    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!hasRole(workspace, req.user._id, 'owner')) {
      return res.status(403).json({ message: 'Only owner can change member roles' });
    }

    const target = getMember(workspace, memberId);
    if (!target) {
      return res.status(404).json({ message: 'Member not found in this workspace' });
    }

    if (target.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change the owner role' });
    }

    target.role = role;
    await workspace.save();

    return res.status(200).json({
      message: 'Member role updated successfully',
      workspace,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
  updateMemberRole,
};
