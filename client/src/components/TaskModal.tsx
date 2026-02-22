import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface TaskProps {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignedTo?: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  createdBy: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
}

interface Member {
  userId: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  role: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  onDelete?: () => void;
  task?: TaskProps;
  defaultStatus?: "todo" | "in-progress" | "review" | "done";
  boardMembers: Member[];
  isReadOnly?: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  defaultStatus = "todo",
  boardMembers,
  isReadOnly = false,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<
    "todo" | "in-progress" | "review" | "done"
  >("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assignedTo?._id || "");
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate).toISOString().split("T")[0]);
      } else {
        setDueDate("");
      }
    } else {
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setPriority("low");
      setAssignedTo("");
      setDueDate("");
    }
  }, [task, isOpen, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      setIsSubmitting(true);
      await onSave({
        title,
        description,
        status,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg p-6 font-sans max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">
          {task ? (isReadOnly ? "View Task" : "Edit Task") : "Create New Task"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              disabled={isReadOnly}
              className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              >
                <option value="">Unassigned</option>
                {boardMembers.map((member) => (
                  <option key={member.userId._id} value={member.userId._id}>
                    {member.userId.fullName || member.userId.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {!isReadOnly && (
            <div
              className={`flex mt-6 ${task && onDelete ? "justify-between" : "justify-end"}`}
            >
              {task && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none shadow-none"
                >
                  Delete
                </Button>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title || isReadOnly}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
