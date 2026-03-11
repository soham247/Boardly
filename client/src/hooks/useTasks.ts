import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  assignedTo?: string[];
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority?: string;
  dueDate?: string;
  order?: number;
  tags?: string[];
}

export const useTasks = (boardId?: string) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery<Task[]>({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const res = await api.get(`/tasks/board/${boardId}`);
      return res.data.tasks ?? [];
    },
    enabled: isAuthenticated && !!boardId,
  });

  const {
    data: tags = [],
    isLoading: isLoadingTags,
    error: tagsError,
  } = useQuery({
    queryKey: ['tags', boardId],
    queryFn: async () => {
      if (!boardId) return [];
      const res = await api.get(`/tags/${boardId}`);
      return res.data.tags ?? [];
    },
    enabled: isAuthenticated && !!boardId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Task> & { boardId: string }) => {
      const res = await api.post('/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<Task> }) => {
      const res = await api.patch(`/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await api.post(`/tags/${boardId}/create`, data);
      return res.data.tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', boardId] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async (tasksToUpdate: { _id: string; status: string; order: number }[]) => {
      const res = await api.put(`/tasks/board/${boardId}/reorder`, { tasks: tasksToUpdate });
      return res.data;
    },
    onSuccess: () => {
      // We often don't want to immediately invalidate the whole query because
      // of optimistic updates done on the frontend during onDragEnd,
      // but invalidating ensures consistency with the DB.
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTask: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTask: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    createTag: createTagMutation.mutateAsync,
    isCreatingTag: createTagMutation.isPending,
    reorderTasks: reorderTasksMutation.mutateAsync,
    isReordering: reorderTasksMutation.isPending,
    tags,
    isLoadingTags,
    tagsError,
  };
};
