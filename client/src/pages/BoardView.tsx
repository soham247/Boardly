import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useTasks,
  useTasksByStatus,
  type TaskUpdateData,
  type TasksByStatusMap,
} from '../hooks/useTasks';
import { useBoards } from '../hooks/useBoards';
import { TaskColumn } from '../components/TaskColumn';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TaskModal, type TaskFormData } from '../components/TaskModal';
import type { TaskProps } from '../components/TaskModal';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildReorderResult,
  type ColumnStatus,
} from '../lib/taskReorder';
import { useOptimisticTaskReorder } from '../hooks/useOptimisticTaskReorder';

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
  } = useTasks(boardId);

  const { board, isLoadingBoard } = useBoards(undefined, boardId);

  const todoTasksQuery = useTasksByStatus(boardId, 'todo', TASKS_PAGE_SIZE);
  const inProgressTasksQuery = useTasksByStatus(boardId, 'in-progress', TASKS_PAGE_SIZE);
  const reviewTasksQuery = useTasksByStatus(boardId, 'review', TASKS_PAGE_SIZE);
  const doneTasksQuery = useTasksByStatus(boardId, 'done', TASKS_PAGE_SIZE);

  const columnTasksMap: TasksByStatusMap = {
    todo: todoTasksQuery.data?.allTasks ?? EMPTY_COLUMN_TASKS.todo,
    'in-progress': inProgressTasksQuery.data?.allTasks ?? EMPTY_COLUMN_TASKS['in-progress'],
    review: reviewTasksQuery.data?.allTasks ?? EMPTY_COLUMN_TASKS.review,
    done: doneTasksQuery.data?.allTasks ?? EMPTY_COLUMN_TASKS.done,
  };

  const tasksQueryByStatus = {
    todo: todoTasksQuery,
    'in-progress': inProgressTasksQuery,
    review: reviewTasksQuery,
    done: doneTasksQuery,
  } as const;

  const tasksQueryKeyByStatus = {
    todo: ['tasks', boardId, 'todo', TASKS_PAGE_SIZE] as const,
    'in-progress': ['tasks', boardId, 'in-progress', TASKS_PAGE_SIZE] as const,
    review: ['tasks', boardId, 'review', TASKS_PAGE_SIZE] as const,
    done: ['tasks', boardId, 'done', TASKS_PAGE_SIZE] as const,
  };

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === 'object' && error !== null) {
      const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
      return maybeError.response?.data?.message ?? maybeError.message ?? fallback;
    }
    return fallback;
  };

  const reorderMutation = useOptimisticTaskReorder({ boardId, tasksQueryKeyByStatus });

  const isLoadingTasks =
    todoTasksQuery.isLoading ||
    inProgressTasksQuery.isLoading ||
    reviewTasksQuery.isLoading ||
    doneTasksQuery.isLoading;

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
      toast.error(getErrorMessage(error, 'Failed to save task.'));
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !hasWriteAccess) return;
    try {
      await deleteTask(selectedTask._id);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete task.'));
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !hasWriteAccess || !boardId) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const { tasksByStatus, tasksToUpdateItems } = buildReorderResult(
      columnTasksMap,
      source,
      destination,
      draggableId
    );

    if (tasksToUpdateItems.length === 0) return;

    await reorderMutation.mutateAsync({
      source,
      destination,
      nextTasksByStatus: tasksByStatus,
      tasksToUpdateItems,
    });
  };

  // Get tasks for a specific column — reads from local state so optimistic
  // drag-and-drop updates are reflected immediately.
  const getColumnTasks = (status: string): TaskProps[] => {
    return columnTasksMap[status as ColumnStatus] ?? [];
  };

  // Load more tasks for a column
  const handleLoadMore = (status: string): void => {
    const statusQuery = tasksQueryByStatus[status as ColumnStatus];
    if (statusQuery.hasNextPage && !statusQuery.isFetchingNextPage) {
      statusQuery.fetchNextPage();
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
                hasMore={tasksQueryByStatus[col.status].hasNextPage ?? false}
                isLoadingMore={tasksQueryByStatus[col.status].isFetchingNextPage ?? false}
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
