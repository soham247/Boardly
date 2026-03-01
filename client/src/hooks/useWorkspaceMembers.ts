import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface WorkspaceMemberUser {
  _id: string;
  fullName?: string;
  username?: string;
  avatar?: string;
}

export interface WorkspaceMember {
  _id?: string;
  user: WorkspaceMemberUser;
  role: 'owner' | 'admin' | 'shared';
}

export const useWorkspaceMembers = (workspaceId: string, enabled = true) => {
  const queryClient = useQueryClient();

  // ─── fetch members ────────────────────────────────────────────────
  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery<WorkspaceMember[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}`);
      return res.data.workspace.members ?? [];
    },
    enabled: !!workspaceId && enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // ─── add member ───────────────────────────────────────────────────
  const addMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/members`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  // ─── remove member ────────────────────────────────────────────────
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  // ─── update role ──────────────────────────────────────────────────
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  return {
    members,
    isLoading,
    error,
    addMember: addMemberMutation.mutateAsync,
    isAddingMember: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    updateRole: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
  };
};
