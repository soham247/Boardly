import { Calendar, MessageSquare } from 'lucide-react';
import type { TaskProps } from './TaskModal';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
  task: TaskProps;
  index: number;
  onClick: () => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 transition-shadow mb-3 group ${snapshot.isDragging ? 'shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.8)] opacity-90' : 'hover:shadow-md dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer'
            }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-wrap gap-1.5 flex-1 pr-2">
              {task.tags && task.tags.length > 0 && task.tags.map((tag) => (
                <span
                  key={tag._id}
                  className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>

          <h4 className="text-gray-900 dark:text-gray-100 font-semibold text-sm mt-1 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {task.title}
          </h4>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 text-xs font-medium">
              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {task.description && (
                <div className="text-gray-400 dark:text-gray-500">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {task.assignedTo ? (
              <div
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-800 ml-auto"
                title={task.assignedTo.fullName || task.assignedTo.username}
              >
                {task.assignedTo.avatar ? (
                  <img
                    src={task.assignedTo.avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-500 font-medium">
                    {(task.assignedTo.fullName || task.assignedTo.username || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center ml-auto">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">?</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
