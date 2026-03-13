import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useTasks,
  useTasksByStatus,
  type TaskUpdateData,
  type TasksByStatusMap,
  type TasksByStatusQueryData,
} from '../hooks/useTasks';
import { useBoards, type Board } from '../hooks/useBoards';
import { TaskColumn } from '../components/TaskColumn';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult, DraggableLocation } from '@hello-pangea/dnd';
import { TaskModal, type TaskFormData } from '../components/TaskModal';
import type { TaskProps } from '../components/TaskModal';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// Column type definition
type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

// Type for task update items in reorder operation
interface TaskUpdateItem {
  _id: string;
  status: ColumnStatus;
  order: number;
}

// Type for reorder result
interface ReorderResult {
  tasksByStatus: TasksByStatusMap;
  tasksToUpdateItems: TaskUpdateItem[];
}

interface Column {
  title: string;
  status: ColumnStatus;
}

const columns: Column[] = [
  { title: 'To Do', status: 'todo' },
  { title: 'In Progress', status: 'in-progress' },
  { title: 'Review', status: 'review' },
  { title: 'Done', status: 'done' },
];

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const TASKS_PAGE_SIZE = 50;
  const EMPTY_COLUMN_TASKS: TasksByStatusMap = {
    todo: [],
    'in-progress': [],
    review: [],
    done: [],
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProps | undefined>(undefined);
  const [newTaskStatus, setNewTaskStatus] = useState<ColumnStatus>('todo');

  const {
    tags: availableTags,
    isLoadingTags,
    createTask,
    updateTask,
    deleteTask,
    createTag: createTagQuery,
    reorderTasks: reorderTasksQuery,
  } = useTasks(boardId);

  const { board: queryBoard, isLoadingBoard } = useBoards(undefined, boardId);
  const board = (queryBoard as Board | undefined) ?? null;

  const boardTasksQuery = useTasksByStatus(boardId, undefined, TASKS_PAGE_SIZE);
  const columnTasksMap = boardTasksQuery.data?.tasksByStatus ?? EMPTY_COLUMN_TASKS;

  const tasksQueryKey = ['tasks', boardId, 'all', TASKS_PAGE_SIZE] as const;
  const isLoadingTasks = boardTasksQuery.isLoading;

  if (isLoadingBoard || isLoadingTags || isLoadingTasks) {
    return <div className="p-8">Loading board...</div>;
  }

  if (!board) {
    return <div className="p-8">Board not found.</div>;
  }

  const hasWriteAccess = board.userRole === 'write' || board.userRole === 'owner';

  const handleOpenCreateModal = (status: ColumnStatus = 'todo') => {
    if (!hasWriteAccess) return;
    setSelectedTask(undefined);
    setNewTaskStatus(status);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskProps) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    if (!boardId) return;
    try {
      const updateData: TaskUpdateData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assignedTo: taskData.assignedTo,
        dueDate: taskData.dueDate,
        tags: taskData.tags,
      };

      if (selectedTask) {
        await updateTask({ taskId: selectedTask._id, data: updateData });
      } else {
        await createTask({ ...updateData, boardId });
      }
    } catch (error) {
      console.error('Failed to save task', error);
      alert('Error saving task');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !hasWriteAccess) return;
    try {
      await deleteTask(selectedTask._id);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !hasWriteAccess || !boardId) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const buildReorderResult = (
      prevTasksByStatus: TasksByStatusMap,
      source: DraggableLocation,
      destination: DraggableLocation,
      draggableId: string
    ): ReorderResult => {
      const sourceStatus = source.droppableId as ColumnStatus;
      const destinationStatus = destination.droppableId as ColumnStatus;

      const sourceColTasks = [...(prevTasksByStatus[sourceStatus] ?? [])].map((t) => ({ ...t }));
      const destinationColTasks =
        sourceStatus === destinationStatus
          ? sourceColTasks
          : [...(prevTasksByStatus[destinationStatus] ?? [])].map((t) => ({ ...t }));

      const movedTaskIndex = sourceColTasks.findIndex((t) => t._id === draggableId);
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
        sourceColTasks.forEach((t, i) => {
          t.order = i;
          tasksToUpdateItems.push({ _id: t._id, status: t.status as ColumnStatus, order: i });
        });
      }
      destinationColTasks.forEach((t, i) => {
        t.order = i;
        tasksToUpdateItems.push({ _id: t._id, status: t.status as ColumnStatus, order: i });
      });

      const nextTasksByStatus: TasksByStatusMap = {
        ...prevTasksByStatus,
        [sourceStatus]: sourceColTasks,
        [destinationStatus]: destinationColTasks,
      };

      return { tasksByStatus: nextTasksByStatus, tasksToUpdateItems };
    };

    const previousTasksByStatus = columnTasksMap;
    const { tasksByStatus, tasksToUpdateItems } = buildReorderResult(
      previousTasksByStatus,
      source,
      destination,
      draggableId
    );

    if (tasksToUpdateItems.length === 0) return;

    const allTasks = columns.flatMap((column) => tasksByStatus[column.status] ?? []);

    queryClient.setQueryData<TasksByStatusQueryData>(tasksQueryKey, (previousData) => {
      if (!previousData) return previousData;

      return {
        ...previousData,
        allTasks,
        tasksByStatus,
      };
    });

    try {
      await reorderTasksQuery(tasksToUpdateItems);
    } catch (err) {
      console.error('Reorder failed, rolling back state', err);
      queryClient.setQueryData<TasksByStatusQueryData>(tasksQueryKey, (previousData) => {
        if (!previousData) return previousData;

        const rollbackAllTasks = columns.flatMap(
          (column) => previousTasksByStatus[column.status] ?? []
        );

        return {
          ...previousData,
          allTasks: rollbackAllTasks,
          tasksByStatus: previousTasksByStatus,
        };
      });
    }
  };

  // Get tasks for a specific column — reads from local state so optimistic
  // drag-and-drop updates are reflected immediately.
  const getColumnTasks = (status: string): TaskProps[] => {
    return columnTasksMap[status as ColumnStatus] ?? [];
  };

  // Load more tasks for a column
  const handleLoadMore = (_status: string): void => {
    if (boardTasksQuery.hasNextPage && !boardTasksQuery.isFetchingNextPage) {
      boardTasksQuery.fetchNextPage();
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-full font-sans flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-full border-gray-200 dark:border-zinc-800 dark:text-gray-100 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {board.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {board.description || 'No description'}
              </span>
              {!hasWriteAccess && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                  Read-only
                </span>
              )}
            </div>
          </div>
        </div>
        {hasWriteAccess && (
          <Button onClick={() => handleOpenCreateModal('todo')} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 flex-1 items-start snap-x snap-mandatory">
          {columns.map((col) => (
            <div
              key={col.status}
              className="snap-center shrink-0 h-full min-w-70 w-[85vw] md:min-w-0 md:w-auto md:flex-1"
            >
              <TaskColumn
                title={col.title}
                status={col.status}
                tasks={getColumnTasks(col.status)}
                onTaskClick={handleOpenEditModal}
                onLoadMore={() => handleLoadMore(col.status)}
                hasMore={boardTasksQuery.hasNextPage ?? false}
                isLoadingMore={boardTasksQuery.isFetchingNextPage ?? false}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={selectedTask && hasWriteAccess ? handleDeleteTask : undefined}
        task={selectedTask}
        defaultStatus={newTaskStatus}
        boardMembers={board.members ?? []}
        isReadOnly={!hasWriteAccess}
        availableTags={availableTags}
        onCreateTag={async (tagData) => {
          if (!boardId) throw new Error('No board ID');
          return await createTagQuery(tagData);
        }}
      />
    </div>
  );
}
