import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DraggableLocation } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import api from '../lib/api';
import type { TasksByStatusMap } from './useTasks';
import {
  patchTasksByStatusCache,
  type ColumnStatus,
  type TaskUpdateItem,
} from '../lib/taskReorder';

export interface ReorderMutationVariables {
  source: DraggableLocation;
  destination: DraggableLocation;
  nextTasksByStatus: TasksByStatusMap;
  tasksToUpdateItems: TaskUpdateItem[];
}

interface UseOptimisticTaskReorderArgs {
  boardId?: string;
  tasksQueryKeyByStatus: Record<ColumnStatus, readonly unknown[]>;
}

interface ReorderMutationContext {
  sourceStatus: ColumnStatus;
  destinationStatus: ColumnStatus;
  previousSourceData: unknown;
  previousDestinationData: unknown;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    return maybeError.response?.data?.message ?? maybeError.message ?? fallback;
  }
  return fallback;
};

export const useOptimisticTaskReorder = ({
  boardId,
  tasksQueryKeyByStatus,
}: UseOptimisticTaskReorderArgs) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, ReorderMutationVariables, ReorderMutationContext>({
    mutationFn: async ({ tasksToUpdateItems }) => {
      const res = await api.put(`/tasks/board/${boardId}/reorder`, { tasks: tasksToUpdateItems });
      return res.data;
    },
    onMutate: async ({ source, destination, nextTasksByStatus }) => {
      const sourceStatus = source.droppableId as ColumnStatus;
      const destinationStatus = destination.droppableId as ColumnStatus;
      const sourceKey = tasksQueryKeyByStatus[sourceStatus];
      const destinationKey = tasksQueryKeyByStatus[destinationStatus];

      await queryClient.cancelQueries({ queryKey: sourceKey });
      if (sourceStatus !== destinationStatus) {
        await queryClient.cancelQueries({ queryKey: destinationKey });
      }

      const previousSourceData = queryClient.getQueryData(sourceKey);
      const previousDestinationData =
        sourceStatus === destinationStatus
          ? previousSourceData
          : queryClient.getQueryData(destinationKey);

      patchTasksByStatusCache(queryClient, sourceKey, nextTasksByStatus[sourceStatus] ?? []);
      if (sourceStatus !== destinationStatus) {
        patchTasksByStatusCache(queryClient, destinationKey, nextTasksByStatus[destinationStatus] ?? []);
      }

      return {
        sourceStatus,
        destinationStatus,
        previousSourceData,
        previousDestinationData,
      };
    },
    onError: (error, _variables, context) => {
      if (!context) return;

      queryClient.setQueryData(tasksQueryKeyByStatus[context.sourceStatus], context.previousSourceData);
      if (context.sourceStatus !== context.destinationStatus) {
        queryClient.setQueryData(
          tasksQueryKeyByStatus[context.destinationStatus],
          context.previousDestinationData
        );
      }

      toast.error(getErrorMessage(error, 'Failed to reorder tasks. Changes were rolled back.'));
    },
    onSettled: (_data, _error, variables) => {
      const sourceStatus = variables.source.droppableId as ColumnStatus;
      const destinationStatus = variables.destination.droppableId as ColumnStatus;

      queryClient.invalidateQueries({ queryKey: tasksQueryKeyByStatus[sourceStatus] });
      if (sourceStatus !== destinationStatus) {
        queryClient.invalidateQueries({ queryKey: tasksQueryKeyByStatus[destinationStatus] });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });
};
