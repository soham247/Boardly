import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';

export interface UserInfo {
  _id: string;
  fullName: string;
  username: string;
  avatar?: string;
}

export interface BoardMember {
  userId: UserInfo;
  role: string;
}

export interface BoardMemberInput {
  userId: string;
  role: string;
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  members?: BoardMember[];
  userRole?: 'owner' | 'write' | 'read';
  createdAt?: string;
  updatedAt?: string;
}

export const useBoards = (workspaceId?: string, boardId?: string) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch all boards for a workspace
  const {
    data: boards = [],
    isLoading: isLoadingBoards,
    error: boardsError,
  } = useQuery<Board[]>({
    queryKey: ['boards', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/boards/workspace/${workspaceId}`);
      return res.data.boards ?? [];
    },
    enabled: isAuthenticated && !!workspaceId,
  });

  // Fetch a specific board by ID
  const {
    data: board,
    isLoading: isLoadingBoard,
    error: boardError,
  } = useQuery<Board | null>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      if (!boardId) return null;
      const res = await api.get(`/boards/${boardId}`);
      return res.data.board;
    },
    enabled: isAuthenticated && !!boardId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      workspaceId: string;
      members?: BoardMemberInput[];
    }) => {
      const res = await api.post('/boards', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boards', variables.workspaceId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      boardId,
      data,
    }: {
      boardId: string;
      data: {
        name?: string;
        description?: string;
        members?: BoardMemberInput[];
      };
    }) => {
      const res = await api.patch(`/boards/${boardId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] });
      // We also invalidate boards list just universally to keep it synced
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/boards/${boardId}`);
      return boardId;
    },
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  return {
    boards,
    isLoadingBoards,
    boardsError,

    board,
    isLoadingBoard,
    boardError,

    createBoard: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateBoard: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteBoard: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
