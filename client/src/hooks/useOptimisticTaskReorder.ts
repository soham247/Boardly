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
import { getErrorMessage } from '../lib/errorUtils';

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

export const useOptimisticTaskReorder = ({
  boardId,
  tasksQueryKeyByStatus,
}: UseOptimisticTaskReorderArgs) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, ReorderMutationVariables, ReorderMutationContext>({
    mutationFn: async ({ tasksToUpdateItems }) => {
      if (!boardId) {
        throw new Error('Missing boardId in useOptimisticTaskReorder mutation');
      }
      const res = await api.put(`/tasks/board/${boardId}/reorder`, { tasks: tasksToUpdateItems });
      return res.data;
    },
    onMutate: async ({ source, destination, nextTasksByStatus, tasksToUpdateItems }) => {
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

      const touchedTaskIds = new Set<string>(tasksToUpdateItems.map((t) => t._id));

      patchTasksByStatusCache(
        queryClient,
        sourceKey,
        nextTasksByStatus[sourceStatus] ?? [],
        touchedTaskIds
      );
      if (sourceStatus !== destinationStatus) {
        patchTasksByStatusCache(
          queryClient,
          destinationKey,
          nextTasksByStatus[destinationStatus] ?? [],
          touchedTaskIds
        );
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

      queryClient.setQueryData(
        tasksQueryKeyByStatus[context.sourceStatus],
        context.previousSourceData
      );
      if (context.sourceStatus !== context.destinationStatus) {
        queryClient.setQueryData(
          tasksQueryKeyByStatus[context.destinationStatus],
          context.previousDestinationData
        );
      }

      toast.error(getErrorMessage(error, 'Failed to reorder tasks. Changes were rolled back.'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', boardId] });
    },
  });
};
