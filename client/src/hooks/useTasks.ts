import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface UserInfo {
  _id: string;
  fullName: string;
  username: string;
  avatar?: string;
}

export interface TagInfo {
  _id: string;
  name: string;
  color: string;
  boardId?: string | null;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  assignedTo?: UserInfo[];
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order?: number;
  tags?: TagInfo[];
  createdBy: UserInfo;
}

// DTO for creating/updating tasks (what we send to the API)
export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string[]; // User IDs
  dueDate?: string;
  tags?: string[]; // Tag IDs
}

// Interface for paginated task response
export interface PaginatedTasksResponse {
  message: string;
  tasks: Task[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type TasksByStatusMap = Record<TaskStatus, Task[]>;

export interface TasksByStatusQueryData {
  pages: PaginatedTasksResponse[];
  pageParams: unknown[];
  allTasks: Task[];
  tasksByStatus: TasksByStatusMap;
}

// Separate hook for fetching tasks by status with pagination
export const useTasksByStatus = (
  boardId?: string,
  status?: TaskStatus,
  limit = 10
) => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery<PaginatedTasksResponse, Error, TasksByStatusQueryData>({
    queryKey: ['tasks', boardId, status ?? 'all', limit],
    queryFn: async ({ pageParam }) => {
      if (!boardId) {
        return { message: '', tasks: [], nextCursor: null, hasMore: false };
      }
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      params.append('limit', limit.toString());
      if (pageParam) {
        params.append('cursor', pageParam as string);
      }
      const res = await api.get(`/tasks/board/${boardId}?${params.toString()}`);
      return {
        message: res.data.message,
        tasks: res.data.tasks ?? [],
        nextCursor: res.data.nextCursor ?? null,
        hasMore: res.data.hasMore ?? false,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore && lastPage.nextCursor) {
        return lastPage.nextCursor;
      }
      return undefined;
    },
    select: (data) => {
      const allTasks = data.pages
        .flatMap((page) => page.tasks ?? [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const tasksByStatus: TasksByStatusMap = {
        todo: [],
        'in-progress': [],
        review: [],
        done: [],
      };

      allTasks.forEach((task) => {
        tasksByStatus[task.status].push(task);
      });

      return {
        pages: data.pages,
        pageParams: data.pageParams,
        allTasks,
        tasksByStatus,
      };
    },
    enabled: isAuthenticated && !!boardId,
  });
};

export const useTasks = (boardId?: string) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Original all-tasks query (backward compatible)
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
    mutationFn: async (data: TaskUpdateData & { boardId: string }) => {
      const res = await api.post('/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: TaskUpdateData }) => {
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
