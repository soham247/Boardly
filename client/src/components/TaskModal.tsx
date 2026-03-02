import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface TagProps {
  _id: string;
  name: string;
  color: string;
  boardId?: string | null;
}

export interface TaskProps {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags?: TagProps[];
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
  defaultStatus?: 'todo' | 'in-progress' | 'review' | 'done';
  boardMembers: Member[];
  isReadOnly?: boolean;
  availableTags?: TagProps[];
  onCreateTag?: (data: { name: string; color: string }) => Promise<TagProps>;
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  defaultStatus = 'todo',
  boardMembers,
  isReadOnly = false,
  availableTags = [],
  onCreateTag,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'review' | 'done'>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assignedTo?._id || '');
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
      } else {
        setDueDate('');
      }
      setTags(task.tags?.map(t => t._id) || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('low');
      setAssignedTo('');
      setDueDate('');
      setTags([]);
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
        tags,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task', error);
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
        className="bg-white dark:bg-zinc-950 rounded-lg w-full max-w-lg p-6 font-sans max-h-[90vh] overflow-y-auto border border-transparent dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
          {task ? (isReadOnly ? 'View Task' : 'Edit Task') : 'Create New Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              disabled={isReadOnly}
              className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              disabled={isReadOnly}
              className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReadOnly}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:dark:invert"
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags?.map((tag) => (
                  <button
                    key={tag._id}
                    type="button"
                    onClick={() => {
                      if (isReadOnly) return;
                      setTags(prev => prev.includes(tag._id) ? prev.filter(t => t !== tag._id) : [...prev, tag._id])
                    }}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${tags.includes(tag._id) ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950 ring-indigo-500 shadow-sm' : 'opacity-60 scale-95 hover:opacity-100 hover:scale-100'
                      }`}
                    style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                    disabled={isReadOnly}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              {!isReadOnly && onCreateTag && (
                <div className="mt-3 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="New custom tag"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    className="flex h-8 w-32 items-center rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-2 py-1 text-xs"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={e => setNewTagColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium dark:text-gray-100 dark:hover:bg-zinc-800"
                    disabled={!newTagName || isCreatingTag}
                    onClick={async () => {
                      if (!onCreateTag) return;
                      try {
                        setIsCreatingTag(true);
                        const newTag = await onCreateTag({ name: newTagName, color: newTagColor });
                        setTags(prev => [...prev, newTag._id]);
                        setNewTagName('');
                      } catch (error) {
                        console.error(error);
                      } finally {
                        setIsCreatingTag(false);
                      }
                    }}
                  >
                    {isCreatingTag ? '...' : 'Add Tag'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!isReadOnly && (
            <div className={`flex mt-6 ${task && onDelete ? 'justify-between' : 'justify-end'}`}>
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
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
