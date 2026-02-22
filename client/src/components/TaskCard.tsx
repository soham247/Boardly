import { Calendar, MessageSquare } from "lucide-react";
import type { TaskProps } from "./TaskModal";

interface TaskCardProps {
  task: TaskProps;
  onClick: () => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer mb-3 group"
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      <h4 className="text-gray-900 font-semibold text-sm mb-2 group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3 text-xs font-medium">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-gray-400"}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          {task.description && (
            <div className="text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {task.assignedTo ? (
          <div
            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200 ml-auto"
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
                {(task.assignedTo.fullName || task.assignedTo.username || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center ml-auto">
            <span className="text-[10px] text-gray-400">?</span>
          </div>
        )}
      </div>
    </div>
  );
}
