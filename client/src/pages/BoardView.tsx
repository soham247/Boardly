import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks, useTasksByStatus } from '../hooks/useTasks';
import { useBoards } from '../hooks/useBoards';
import { TaskColumn } from '../components/TaskColumn';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { TaskModal } from '../components/TaskModal';
import type { TaskProps } from '../components/TaskModal';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Column type definition
type ColumnStatus = 'todo' | 'in-progress' | 'review' | 'done';

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

  const [board, setBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskProps[]>([]);
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
    isReordering,
  } = useTasks(boardId);

  const { board: queryBoard, isLoadingBoard } = useBoards(undefined, boardId);

  // Create separate infinite queries for each column - hooks must be at top level
  const todoTasksQuery = useTasksByStatus(boardId, 'todo', 10);
  const inProgressTasksQuery = useTasksByStatus(boardId, 'in-progress', 10);
  const reviewTasksQuery = useTasksByStatus(boardId, 'review', 10);
  const doneTasksQuery = useTasksByStatus(boardId, 'done', 10);

  // Store queries in a map for easy access
  const columnTaskQueries = useMemo(
    () => ({
      todo: todoTasksQuery,
      'in-progress': inProgressTasksQuery,
      review: reviewTasksQuery,
      done: doneTasksQuery,
    }),
    [
      todoTasksQuery.data,
      todoTasksQuery.isLoading,
      todoTasksQuery.hasNextPage,
      todoTasksQuery.isFetchingNextPage,
      inProgressTasksQuery.data,
      inProgressTasksQuery.isLoading,
      inProgressTasksQuery.hasNextPage,
      inProgressTasksQuery.isFetchingNextPage,
      reviewTasksQuery.data,
      reviewTasksQuery.isLoading,
      reviewTasksQuery.hasNextPage,
      reviewTasksQuery.isFetchingNextPage,
      doneTasksQuery.data,
      doneTasksQuery.isLoading,
      doneTasksQuery.hasNextPage,
      doneTasksQuery.isFetchingNextPage,
    ]
  );

  // Combine tasks from all columns
  useEffect(() => {
    if (isReordering) return;
    const allTasks: TaskProps[] = [];
    columns.forEach((col) => {
      const query = columnTaskQueries[col.status];
      if (query && query.data) {
        query.data.pages.forEach((page: any) => {
          allTasks.push(...page.tasks);
        });
      }
    });
    setTasks(allTasks);
  }, [
    todoTasksQuery.data,
    inProgressTasksQuery.data,
    reviewTasksQuery.data,
    doneTasksQuery.data,
    isReordering,
  ]);

  // Check if any column is loading
  const isLoadingTasks = columns.some((col) => columnTaskQueries[col.status]?.isLoading);

  useEffect(() => {
    if (queryBoard) {
      setBoard(queryBoard);
    }
  }, [queryBoard]);

  // Memoize column tasks to prevent unnecessary re-renders
  // Must be above early returns so hooks are called unconditionally
  const columnTasksMap = useMemo(() => {
    const map: Record<ColumnStatus, TaskProps[]> = {
      todo: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    tasks.forEach((t) => {
      if (t.status in map) {
        map[t.status as ColumnStatus].push(t);
      }
    });

    // Sort each column
    columns.forEach((col) => {
      map[col.status].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return map;
  }, [tasks]);

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

  const handleSaveTask = async (taskData: any) => {
    if (!boardId) return;
    try {
      if (selectedTask) {
        await updateTask({ taskId: selectedTask._id, data: taskData });
      } else {
        await createTask({ ...taskData, boardId });
      }
    } catch (error) {
      console.error('Failed to save task', error);
      alert('Error saving task');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !hasWriteAccess) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
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
      prevTasks: TaskProps[],
      source: any,
      destination: any,
      draggableId: string
    ) => {
      const newTasks = prevTasks.map((t) => ({ ...t }));

      const sourceColTasks = newTasks
        .filter((t) => t.status === source.droppableId)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const destColTasks =
        source.droppableId === destination.droppableId
          ? sourceColTasks
          : newTasks
              .filter((t) => t.status === destination.droppableId)
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const movedTaskIndex = sourceColTasks.findIndex((t) => t._id === draggableId);
      if (movedTaskIndex === -1) return { computedTasks: prevTasks, tasksToUpdateItems: [] };

      const [movedTask] = sourceColTasks.splice(movedTaskIndex, 1);
      if (!movedTask) return { computedTasks: prevTasks, tasksToUpdateItems: [] };

      movedTask.status = destination.droppableId as any;
      destColTasks.splice(destination.index, 0, movedTask);

      const tasksToUpdateItems: any[] = [];
      if (source.droppableId !== destination.droppableId) {
        sourceColTasks.forEach((t, i) => {
          t.order = i;
          tasksToUpdateItems.push({ _id: t._id, status: t.status, order: i });
        });
      }
      destColTasks.forEach((t, i) => {
        t.order = i;
        tasksToUpdateItems.push({ _id: t._id, status: t.status, order: i });
      });

      const otherTasks = newTasks.filter(
        (t) => t.status !== source.droppableId && t.status !== destination.droppableId
      );

      const finalTasks = [
        ...otherTasks,
        ...sourceColTasks,
        ...(source.droppableId === destination.droppableId ? [] : destColTasks),
      ];

      return { computedTasks: finalTasks, tasksToUpdateItems };
    };

    const previousTasks = tasks;
    const { computedTasks, tasksToUpdateItems } = buildReorderResult(
      tasks,
      source,
      destination,
      draggableId
    );

    if (tasksToUpdateItems.length === 0) return;

    setTasks(computedTasks);

    try {
      await reorderTasksQuery(tasksToUpdateItems);
    } catch (err) {
      console.error('Reorder failed, rolling back state', err);
      setTasks(() => previousTasks);
    }
  };

  // Get tasks for a specific column
  const getColumnTasks = (status: ColumnStatus) => {
    return columnTasksMap[status];
  };

  // Load more tasks for a column
  const handleLoadMore = (status: ColumnStatus) => {
    const query = columnTaskQueries[status];
    if (query?.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
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
                onAddTask={handleOpenCreateModal}
                hasWriteAccess={hasWriteAccess}
                onLoadMore={() => handleLoadMore(col.status)}
                hasMore={columnTaskQueries[col.status]?.hasNextPage ?? false}
                isLoadingMore={columnTaskQueries[col.status]?.isFetchingNextPage ?? false}
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
        boardMembers={board.members}
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
