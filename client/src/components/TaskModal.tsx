import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, X, UserPlus, ChevronDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  }[];
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

export interface TaskFormData {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string[];
  dueDate?: string;
  tags: string[];
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => Promise<void>;
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
    assignedTo: [] as string[],
    dueDate: '',
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descMode, setDescMode] = useState<'write' | 'preview'>('write');

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
        assignedTo: Array.isArray(task.assignedTo)
          ? task.assignedTo.map((u: Record<string, any>) => u._id)
          : task.assignedTo
            ? [(task.assignedTo as Record<string, any>)._id]
            : [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        tags: task.tags?.map((t) => t._id) || [],
      });
      setDescMode('preview');
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'low',
        assignedTo: [],
        dueDate: '',
        tags: [],
      });
      setDescMode('write');
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
        assignedTo: formData.assignedTo,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-5xl h-[90vh] rounded-xl shadow-lg border border-border flex flex-col overflow-hidden relative ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b border-border bg-background z-10 shrink-0">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 font-mono"></div>
              {isReadOnly ? (
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight">
                  {formData.title}
                </h1>
              ) : (
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Task title"
                  required
                  className="text-2xl sm:text-3xl font-bold bg-transparent border-transparent hover:border-input focus:border-input px-2 -ml-2 h-auto py-1 shadow-none"
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title}
                  className="mr-4"
                  size="sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              )}
              {task && onDelete && !isReadOnly && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task and
                        remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <div className="w-px h-5 bg-border mx-2"></div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden bg-background">
            {/* Left Column */}
            <div className="flex-1 overflow-y-auto px-8 py-8 md:pr-10 border-border custom-scrollbar">
              {/* Description */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Description
                  </h3>
                  {!isReadOnly && (
                    <div className="flex bg-muted/50 p-1 rounded-md">
                      <button
                        type="button"
                        onClick={() => setDescMode('write')}
                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                          descMode === 'write'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setDescMode('preview')}
                        className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                          descMode === 'preview'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>

                {descMode === 'write' && !isReadOnly ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add details... (Markdown is supported)"
                    rows={8}
                    className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-sm resize-y min-h-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                ) : (
                  <div
                    className="markdown-content text-[15px] max-w-none w-full rounded-md border border-transparent bg-transparent min-h-50
                    [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h1]:text-foreground
                    [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-foreground/90
                    [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h3]:text-foreground/80
                    [&>p]:mb-4 [&>p]:leading-relaxed [&>p:last-child]:mb-0 [&>p]:text-foreground/80
                    [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul]:text-foreground/80
                    [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol]:text-foreground/80
                    [&>li]:mb-1
                    [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:my-4 [&>pre]:border [&>pre]:border-border
                    [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>pre>code]:text-foreground/90
                    [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-sm [&>code]:text-primary [&>code]:font-mono
                    [&>blockquote]:border-l-4 [&>blockquote]:border-border [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-4
                    [&_a]:text-primary [&_a]:hover:underline
                  "
                  >
                    {formData.description ? (
                      <ReactMarkdown>{formData.description}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground italic mt-2">Nothing to preview</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="w-80 bg-muted/20 border-l border-border p-8 overflow-y-auto shrink-0 hidden md:block">
              <div className="space-y-8">
                {/* Status */}
                <div className="group">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className="w-full appearance-none bg-background border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 pr-8 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="group">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className="w-full appearance-none bg-background border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-2.5 pr-8 pl-9 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ring-2 ${
                          formData.priority === 'high'
                            ? 'bg-red-500 ring-red-100 dark:ring-red-900/30'
                            : formData.priority === 'medium'
                              ? 'bg-yellow-500 ring-yellow-100 dark:ring-yellow-900/30'
                              : 'bg-green-500 ring-green-100 dark:ring-green-900/30'
                        }`}
                      ></span>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <div className="flex items-center justify-between mb-2 mt-4 md:mt-0">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Assignee
                    </label>
                    {!isReadOnly && (
                      <div className="relative group/assign">
                        <select
                          value=""
                          onChange={(e) => {
                            const newAssigneeId = e.target.value;
                            if (newAssigneeId && !formData.assignedTo.includes(newAssigneeId)) {
                              setFormData((prev) => ({
                                ...prev,
                                assignedTo: [...prev.assignedTo, newAssigneeId],
                              }));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                        >
                          <option value="">Select Assignee</option>
                          {boardMembers
                            .filter((m) => !formData.assignedTo.includes(m.userId._id))
                            .map((member) => (
                              <option key={member.userId._id} value={member.userId._id}>
                                {member.userId.fullName || member.userId.username}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Add Assignee"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Display current assignees */}
                  {formData.assignedTo.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {formData.assignedTo.map((assigneeId) => {
                        const memberInfo = boardMembers.find(
                          (m) => m.userId._id === assigneeId
                        )?.userId;
                        if (!memberInfo) return null;

                        return (
                          <div
                            key={assigneeId}
                            className="flex items-center gap-3 w-full p-2 border border-border rounded-lg text-left bg-background"
                          >
                            {memberInfo.avatar ? (
                              <img
                                src={memberInfo.avatar}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full border border-border object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                {memberInfo.fullName?.charAt(0) ||
                                  memberInfo.username.charAt(0) ||
                                  'U'}
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {memberInfo.fullName || memberInfo.username}
                            </span>
                            {!isReadOnly && (
                              <button
                                type="button"
                                className="ml-auto text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                                onClick={() =>
                                  setFormData((p) => ({
                                    ...p,
                                    assignedTo: p.assignedTo.filter((id) => id !== assigneeId),
                                  }))
                                }
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic px-2">No assignees</div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      disabled={isReadOnly}
                      className="w-full bg-background border border-border rounded-lg text-left text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm p-2.5 disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:dark:invert"
                    />
                  </div>
                </div>

                <div className="h-px bg-border my-6"></div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Tags
                    </label>
                  </div>
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
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                          formData.tags.includes(tag._id)
                            ? 'ring-2 ring-offset-1 ring-offset-background ring-primary shadow-sm'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                          borderColor: tag.color + '40',
                        }}
                        disabled={isReadOnly}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>

                  {!isReadOnly && onCreateTag && (
                    <div className="mt-4 p-3 bg-background border border-border rounded-lg space-y-3">
                      <input
                        type="text"
                        placeholder="New tag label"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newTagColor}
                          onChange={(e) => setNewTagColor(e.target.value)}
                          className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          disabled={!newTagName || isCreatingTag}
                          onClick={async () => {
                            if (!onCreateTag) return;
                            try {
                              setIsCreatingTag(true);
                              const newTag = await onCreateTag({
                                name: newTagName,
                                color: newTagColor,
                              });
                              setFormData((prev) => ({
                                ...prev,
                                tags: [...prev.tags, newTag._id],
                              }));
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
                    </div>
                  )}
                </div>

                <div className="h-px bg-border my-6"></div>

                {/* Added By */}
                {task?.createdBy && (
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">
                      Added By
                    </label>
                    <div className="flex items-center gap-3 w-full p-2 border border-transparent rounded-lg text-left">
                      {task.createdBy.avatar ? (
                        <img
                          src={task.createdBy.avatar}
                          alt="Creator Avatar"
                          className="w-8 h-8 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                          {task.createdBy.fullName?.charAt(0) || task.createdBy.username.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {task.createdBy.fullName || task.createdBy.username}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
