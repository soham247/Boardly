import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import api from '../lib/api';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import { Search, X, Crown, Shield, Share2, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  userRole: 'owner' | 'admin' | 'shared';
}

const roleConfig = {
  owner: {
    icon: Crown,
    label: 'Owner',
    className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    className: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  },
  shared: {
    icon: Share2,
    label: 'Shared',
    className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  },
};

export function ManageMembersModal({
  isOpen,
  onClose,
  workspaceId,
  userRole,
}: ManageMembersModalProps) {
  const { user: currentUser } = useAuthStore();
  const {
    members,
    isLoading: isLoadingMembers,
    addMember,
    removeMember,
    updateRole,
  } = useWorkspaceMembers(workspaceId, isOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Record<string, any>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isOwner = userRole === 'owner';
  const canManage = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const membersRef = useRef(members);
  membersRef.current = members;

  // Search users — only re-run when searchQuery changes, not when members changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await api.get(`/users/search?q=${searchQuery}`);
          // Filter out users who are already owner or admin (shared users can be promoted)
          const nonPromotableIds = membersRef.current
            .filter((m) => m.role === 'owner' || m.role === 'admin')
            .map((m) => m.user._id);
          setSearchResults(
            (res.data.users || []).filter(
              (u: Record<string, any>) => !nonPromotableIds.includes(u._id)
            )
          );
        } catch (error) {
          console.error('Failed to search users', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddMember = async (user: Record<string, any>) => {
    try {
      setActionLoading(user._id);
      // Check if they're already a shared member — they'll be promoted
      const existingShared = members.find((m) => m.user._id === user._id && m.role === 'shared');
      await addMember({ memberId: user._id });
      toast.success(
        existingShared
          ? `${user.fullName || user.username} promoted to Admin`
          : `${user.fullName || user.username} added as Admin`
      );
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: unknown) {
      toast.error((error as Record<string, any>).response?.data?.message || 'Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (member: (typeof members)[0]) => {
    try {
      setActionLoading(member.user._id);
      await removeMember(member.user._id);
      toast.success(`${member.user.fullName || member.user.username} removed`);
    } catch (error: unknown) {
      toast.error(
        (error as Record<string, any>).response?.data?.message || 'Failed to remove member'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (member: (typeof members)[0], newRole: string) => {
    try {
      setActionLoading(member.user._id);
      await updateRole({ memberId: member.user._id, role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch (error: unknown) {
      toast.error(
        (error as Record<string, any>).response?.data?.message || 'Failed to update role'
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  // Split members into admin/owner vs shared
  const managedMembers = members.filter((m) => m.role === 'owner' || m.role === 'admin');
  const sharedMembers = members.filter((m) => m.role === 'shared');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 p-6 rounded-xl shadow-lg w-full max-w-lg border border-transparent dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Manage Members
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-5 text-sm">
          Add admins to your workspace. Shared members are added automatically when you share a
          board with them.
        </p>

        {/* Add Admin Section — only for owner/admin */}
        {canManage && (
          <div className="space-y-3 relative mb-6" ref={searchRef}>
            <Label>Add Admin</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {searchQuery.length > 1 && (
              <div className="absolute z-10 w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => {
                    const isSharedAlready = members.find(
                      (m) => m.user._id === user._id && m.role === 'shared'
                    );
                    return (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer border-b border-gray-50 dark:border-zinc-800/50 last:border-0"
                        onClick={() => handleAddMember(user)}
                      >
                        <div className="flex items-center gap-2.5">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt="avatar"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                                {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        {actionLoading === user._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <span className="text-xs text-indigo-500 font-medium">
                            {isSharedAlready ? '↑ Promote' : '+ Add Admin'}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admins & Owner */}
        <div className="mb-4">
          <Label className="mb-2 block">Admins & Owner ({managedMembers.length})</Label>
          <div className="max-h-[180px] overflow-y-auto space-y-1 border border-gray-100 dark:border-zinc-800 rounded-lg p-1.5">
            {isLoadingMembers ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              managedMembers.map((member) => {
                const cfg = roleConfig[member.role];
                const RoleIcon = cfg.icon;
                const isSelf = member.user._id === currentUser?.id;
                const isOwnerMember = member.role === 'owner';

                return (
                  <div
                    key={member.user._id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                          <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                            {(member.user.fullName || member.user.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.user.fullName || member.user.username}
                          {isSelf && <span className="text-xs text-gray-400 ml-1">(You)</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{member.user.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {actionLoading === member.user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {/* Role badge (owner) or dropdown (admin — owner can demote) */}
                          {isOwner && !isOwnerMember ? (
                            <select
                              className="text-xs border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700 dark:text-gray-100"
                              value={member.role}
                              onChange={(e) => handleRoleChange(member, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="shared">Demote to Shared</option>
                            </select>
                          ) : (
                            <span
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          )}

                          {/* Remove — only owner/admin can remove admins, not self or owner */}
                          {canManage && !isOwnerMember && !isSelf && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Remove member"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Shared Members (read-only, managed via board sharing) */}
        {sharedMembers.length > 0 && (
          <div>
            <Label className="mb-2 block text-gray-500 dark:text-gray-400">
              Shared via Boards ({sharedMembers.length})
            </Label>
            <div className="max-h-[140px] overflow-y-auto space-y-1 border border-gray-100 dark:border-zinc-800 rounded-lg p-1.5 bg-gray-50/50 dark:bg-zinc-900/30">
              {sharedMembers.map((member) => {
                const cfg = roleConfig.shared;
                const RoleIcon = cfg.icon;

                return (
                  <div
                    key={member.user._id}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center">
                          <span className="text-[11px] text-gray-400 font-medium">
                            {(member.user.fullName || member.user.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {member.user.fullName || member.user.username}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          @{member.user.username}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 pl-1">
              These members were added automatically when a board was shared with them.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
