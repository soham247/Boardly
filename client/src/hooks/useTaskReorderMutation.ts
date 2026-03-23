import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';
import type { Task, TasksByStatusMap } from './useTasks';

export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface TaskUpdateItem {
  _id: string;
  status: ColumnStatus;
  order: number;
}

interface ReorderMutationVariables {
  boardId: string;
  tasksToUpdateItems: TaskUpdateItem[];
  sourceStatus: ColumnStatus;
  destinationStatus: ColumnStatus;
  optimisticTasksByStatus: TasksByStatusMap;
  previousTasksByStatus: TasksByStatusMap;
}

interface ReorderMutationContext {
  previousTasksByStatus: TasksByStatusMap;
  sourceStatus: ColumnStatus;
  destinationStatus: ColumnStatus;
}

interface UseTaskReorderMutationParams {
  tasksQueryKeyByStatus: Record<ColumnStatus, readonly unknown[]>;
  updateColumnQueryCache: (status: ColumnStatus, nextColumnTasks: Task[]) => void;
}

export const useTaskReorderMutation = ({
  tasksQueryKeyByStatus,
  updateColumnQueryCache,
}: UseTaskReorderMutationParams) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, ReorderMutationVariables, ReorderMutationContext>({
    mutationFn: async ({ boardId, tasksToUpdateItems }) => {
      const res = await api.put(`/tasks/board/${boardId}/reorder`, { tasks: tasksToUpdateItems });
      return res.data;
    },
    onMutate: async ({
      sourceStatus,
      destinationStatus,
      optimisticTasksByStatus,
      previousTasksByStatus,
    }) => {
      // Prevent stale fetches from overwriting optimistic cache updates.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: tasksQueryKeyByStatus[sourceStatus] }),
        sourceStatus !== destinationStatus
          ? queryClient.cancelQueries({ queryKey: tasksQueryKeyByStatus[destinationStatus] })
          : Promise.resolve(),
      ]);

      updateColumnQueryCache(sourceStatus, optimisticTasksByStatus[sourceStatus] ?? []);
      if (sourceStatus !== destinationStatus) {
        updateColumnQueryCache(destinationStatus, optimisticTasksByStatus[destinationStatus] ?? []);
      }

      return { previousTasksByStatus, sourceStatus, destinationStatus };
    },
    onError: (error, _variables, context) => {
      if (!context) return;

      updateColumnQueryCache(context.sourceStatus, context.previousTasksByStatus[context.sourceStatus] ?? []);
      if (context.sourceStatus !== context.destinationStatus) {
        updateColumnQueryCache(
          context.destinationStatus,
          context.previousTasksByStatus[context.destinationStatus] ?? []
        );
      }

      toast.error(`Failed to reorder tasks: ${error.message}`);
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tasksQueryKeyByStatus[variables.sourceStatus] }),
        variables.sourceStatus !== variables.destinationStatus
          ? queryClient.invalidateQueries({ queryKey: tasksQueryKeyByStatus[variables.destinationStatus] })
          : Promise.resolve(),
      ]);
    },
  });
};
