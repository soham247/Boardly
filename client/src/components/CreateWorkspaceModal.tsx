import React, { useState } from 'react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const { createWorkspace } = useWorkspaces();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    toast.promise(createWorkspace({ name, slug }), {
      loading: 'Creating workspace...',
      success: () => {
        onSuccess();
        return 'Workspace created successfully!';
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (err: any) => {
        return err.response?.data?.message || 'Failed to create workspace';
      },
    });

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-lg w-full max-w-md border border-transparent dark:border-zinc-800">
        <h2 className="text-xl font-bold mb-4 dark:text-gray-100">Create Workspace</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              placeholder="My Workspace"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Workspace Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-workspace"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
