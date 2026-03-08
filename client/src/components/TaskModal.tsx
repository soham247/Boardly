import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

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
  order?: number;
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'low' as 'low' | 'medium' | 'high',
    assignedTo: '',
    dueDate: '',
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo?._id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        tags: task.tags?.map((t) => t._id) || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'low',
        assignedTo: '',
        dueDate: '',
        tags: [],
      });
    }
  }, [task, isOpen, defaultStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      setIsSubmitting(true);
      await onSave({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags,
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
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Task title"
              required
              disabled={isReadOnly}
              className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Markdown)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write markdown here... **bold**, *italic*, # heading, - list, [link](url), ```code```"
                rows={5}
                disabled={isReadOnly}
                className="flex w-full rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-3 py-2 text-sm resize-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="border border-gray-200 dark:border-zinc-800 rounded-md overflow-hidden flex flex-col">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900 px-3 py-2 border-b border-gray-200 dark:border-zinc-800">
                  Preview
                </div>
                <div className="flex-1 overflow-y-auto p-3 text-sm bg-white dark:bg-zinc-950 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{formData.description || 'Preview will appear here...'}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
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
                name="priority"
                value={formData.priority}
                onChange={handleChange}
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
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
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
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
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
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.includes(tag._id)
                          ? prev.tags.filter((t) => t !== tag._id)
                          : [...prev.tags, tag._id],
                      }));
                    }}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-all ${
                      formData.tags.includes(tag._id)
                        ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950 ring-indigo-500 shadow-sm'
                        : 'opacity-60 scale-95 hover:opacity-100 hover:scale-100'
                    }`}
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      borderColor: tag.color,
                    }}
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
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex h-8 w-32 items-center rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-gray-100 px-2 py-1 text-xs"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
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
                        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag._id] }));
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
                  disabled={isSubmitting || !formData.title || isReadOnly}
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
