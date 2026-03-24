import type { QueryClient, InfiniteData } from '@tanstack/react-query';
import type { Task, TasksByStatusMap, PaginatedTasksResponse } from '../hooks/useTasks';
import type { DraggableLocation } from '@hello-pangea/dnd';

export type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface TaskUpdateItem {
  _id: string;
  status: ColumnStatus;
  order: number;
}

export interface ReorderResult {
  tasksByStatus: TasksByStatusMap;
  tasksToUpdateItems: TaskUpdateItem[];
}

export const buildReorderResult = (
  prevTasksByStatus: TasksByStatusMap,
  source: DraggableLocation,
  destination: DraggableLocation,
  draggableId: string
): ReorderResult => {
  const sourceStatus = source.droppableId as ColumnStatus;
  const destinationStatus = destination.droppableId as ColumnStatus;

  const sourceColTasks = [...(prevTasksByStatus[sourceStatus] ?? [])].map((task) => ({ ...task }));
  const destinationColTasks =
    sourceStatus === destinationStatus
      ? sourceColTasks
      : [...(prevTasksByStatus[destinationStatus] ?? [])].map((task) => ({ ...task }));

  const movedTaskIndex = sourceColTasks.findIndex((task) => task._id === draggableId);
  if (movedTaskIndex === -1) {
    return { tasksByStatus: prevTasksByStatus, tasksToUpdateItems: [] };
  }

  const [movedTask] = sourceColTasks.splice(movedTaskIndex, 1);
  if (!movedTask) {
    return { tasksByStatus: prevTasksByStatus, tasksToUpdateItems: [] };
  }

  movedTask.status = destinationStatus;
  destinationColTasks.splice(destination.index, 0, movedTask);

  const tasksToUpdateItems: TaskUpdateItem[] = [];
  if (sourceStatus !== destinationStatus) {
    sourceColTasks.forEach((task, index) => {
      task.order = index;
      tasksToUpdateItems.push({ _id: task._id, status: task.status as ColumnStatus, order: index });
    });
  }

  destinationColTasks.forEach((task, index) => {
    task.order = index;
    tasksToUpdateItems.push({ _id: task._id, status: task.status as ColumnStatus, order: index });
  });

  const nextTasksByStatus: TasksByStatusMap = {
    ...prevTasksByStatus,
    [sourceStatus]: sourceColTasks,
    [destinationStatus]: destinationColTasks,
  };

  return { tasksByStatus: nextTasksByStatus, tasksToUpdateItems };
};

export const patchTasksByStatusCache = (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  nextColumnTasks: Task[]
): void => {
  const nextTasksMap = new Map(nextColumnTasks.map((task) => [task._id, task]));

  queryClient.setQueryData<InfiniteData<PaginatedTasksResponse>>(queryKey, (previousData) => {
    if (!previousData) return previousData;

    const placedIds = new Set<string>();

    const pages = previousData.pages.map((page) => {
      const tasks: Task[] = [];

      // Process existing tasks: replace if in nextTasksMap, otherwise keep original
      for (const task of page.tasks) {
        if (nextTasksMap.has(task._id)) {
          const updatedTask = nextTasksMap.get(task._id)!;
          placedIds.add(task._id);
          tasks.push(updatedTask);
        } else {
          tasks.push(task);
        }
      }

      // Append remaining tasks from nextTasksMap that weren't already in the page
      for (const [taskId, task] of nextTasksMap) {
        if (!placedIds.has(taskId)) {
          tasks.push(task);
          placedIds.add(taskId);
        }
      }

      return { ...page, tasks };
    });

    const unplacedTasks = nextColumnTasks.filter((task) => !placedIds.has(task._id));
    if (unplacedTasks.length > 0 && pages.length > 0) {
      pages[0] = { ...pages[0], tasks: [...unplacedTasks, ...pages[0].tasks] };
    }

    return { ...previousData, pages };
  });
};
