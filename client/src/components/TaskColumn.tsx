import type { TaskProps } from "./TaskModal";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

interface TaskColumnProps {
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  tasks: TaskProps[];
  onTaskClick: (task: TaskProps) => void;
  onAddTask: (status: "todo" | "in-progress" | "review" | "done") => void;
  hasWriteAccess: boolean;
}

export function TaskColumn({
  title,
  status,
  tasks,
  onTaskClick,
  onAddTask,
  hasWriteAccess,
}: TaskColumnProps) {
  return (
    <div className="bg-gray-50/50 rounded-2xl p-4 flex flex-col h-full border border-gray-100">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-white border border-gray-200 text-gray-500 text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {hasWriteAccess && (
        <button
          onClick={() => onAddTask(status)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      )}
    </div>
  );
}
