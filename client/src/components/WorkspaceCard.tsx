import { ArrowRight, User, Users, Trash2, Crown, Shield, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useState } from 'react';

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

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspace: Record<string, any>;
};

const roleBadgeConfig = {
  owner: {
    label: 'Owner',
    icon: Crown,
    className:
      'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className:
      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  },
  shared: {
    label: 'Shared',
    icon: Share2,
    className:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  },
};

export function WorkspaceCard({ workspace }: Props) {
  const navigate = useNavigate();

  const memberCount = workspace.members?.length || 1;
  const isPersonal = memberCount === 1;
  const userRole: 'owner' | 'admin' | 'shared' = workspace.userRole || 'shared';
  const isOwner = userRole === 'owner';

  const badge = roleBadgeConfig[userRole];
  const BadgeIcon = badge.icon;

  const { deleteWorkspace } = useWorkspaces();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const promise = deleteWorkspace(workspace._id);

      toast.promise(promise, {
        loading: 'Deleting workspace...',
        success: 'Workspace deleted successfully',
        error: 'Failed to delete workspace',
      });

      await promise;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/workspaces/${workspace._id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Space') {
          e.preventDefault();
          navigate(`/workspaces/${workspace._id}`);
        }
      }}
      tabIndex={0}
      role="button"
      className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 h-full bg-card border border-gray-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] flex flex-col"
    >
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        {/* LEFT ICON */}
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
          {isPersonal ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        </div>

        {/* RIGHT ACTIONS */}
        <div
          className="flex items-center gap-2"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* DELETE — only visible to owner */}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  aria-label="Delete workspace"
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{workspace.name}"? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* ARROW */}
          <ArrowRight
            className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="mb-6 grow text-left">
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 mb-1">
          {workspace.name}
        </h3>

        <div className="flex items-center text-[13px] text-gray-500 dark:text-gray-400 gap-1.5">
          <span>{isPersonal ? 'Private' : 'Team'}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="pt-4 border-t border-gray-100/80 dark:border-zinc-800/80 flex items-center justify-between mt-auto">
        <div className="flex -space-x-1.5">
          {[...Array(Math.min(3, memberCount))].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border-[1.5px] border-white dark:border-zinc-950 flex items-center justify-center shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          ))}
        </div>

        {/* Role Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase ${badge.className}`}
        >
          <BadgeIcon className="w-3 h-3" />
          {badge.label}
        </div>
      </div>
    </div>
  );
}
