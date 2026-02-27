import { ArrowRight, User, Users, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useState } from "react";

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
} from "@/components/ui/alert-dialog";

type Props = {
  workspace: Record<string, any>;
};

export function WorkspaceCard({ workspace }: Props) {
  const navigate = useNavigate();

  const memberCount = (workspace.members?.length || 0) + 1;
  const isPersonal = memberCount === 1;

  const { deleteWorkspace } = useWorkspaces();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const promise = deleteWorkspace(workspace._id);

      toast.promise(promise, {
        loading: "Deleting workspace...",
        success: "Workspace deleted successfully",
        error: "Failed to delete workspace",
      });

      await promise;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/workspaces/${workspace._id}`)}
      className="group cursor-pointer h-full bg-card border border-gray-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] flex flex-col"
    >
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-6">
        {/* LEFT ICON */}
        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
          {isPersonal ? (
            <User className="w-5 h-5" />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>

        {/* RIGHT ACTIONS */}
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* DELETE */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete workspace"
                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete Workspace
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "
                  {workspace.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ARROW */}
          <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="mb-6 grow text-left">
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 mb-1">
          {workspace.name}
        </h3>

        <div className="flex items-center text-[13px] text-gray-500 dark:text-gray-400 gap-1.5">
          <span>{isPersonal ? "Private" : "Shared"}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>
            {memberCount} {memberCount === 1 ? "member" : "members"}
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

        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 m-0.5 bg-emerald-500"></span>
          </span>
          Active now
        </div>
      </div>
    </div>
  );
}