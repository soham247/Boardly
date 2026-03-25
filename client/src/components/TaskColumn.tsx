import type { TaskProps } from './TaskModal';
import { TaskCard } from './TaskCard';
import { Loader2 } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

interface TaskColumnProps {
  title: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  tasks: TaskProps[];
  onTaskClick: (task: TaskProps) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function TaskColumn({
  title,
  status,
  tasks,
  onTaskClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: TaskColumnProps) {
  return (
    <div className="bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl p-4 flex flex-col h-full border border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto no-scrollbar pb-2 min-h-12.5 transition-colors rounded-xl ${
              snapshot.isDraggingOver ? 'bg-gray-100/50 dark:bg-zinc-800/50' : ''
            }`}
          >
            {tasks
              .sort((a: TaskProps, b: TaskProps) => (a.order || 0) - (b.order || 0))
              .map((task, index) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Load More Button for Infinite Scroll */}
      {onLoadMore && hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Load more'
          )}
        </button>
      )}
    </div>
  );
}
