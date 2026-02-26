import { useState } from "react";
import { useWorkspaces } from "../hooks/useWorkspaces";
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal";
import { Plus } from "lucide-react";
import { WorkspaceCard } from "@/components/WorkspaceCard";
import { WorkspaceViewSkeleton } from "@/components/WorkspaceViewSkeleton";

const WorkspaceList = () => {
  const { workspaces, isLoading } = useWorkspaces();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            My Workspaces
          </h1>
          <p className="text-muted-foreground max-w-lg leading-relaxed text-[15px]">
            Select a workspace to continue where you left off, or start a new
            journey with your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading &&
            Array(3).fill(0).map((_, i) => <WorkspaceViewSkeleton key={i} />)
          }
          {
            workspaces.map((workspace) => (
              <WorkspaceCard key={workspace._id} workspace={workspace} />
            ))
          }

          {!isLoading &&
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="group h-full flex flex-col items-center justify-center p-6 border-[1.5px] border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-card hover:bg-gray-50 dark:hover:bg-zinc-800/80 hover:border-gray-300 dark:hover:border-zinc-700 transition-all duration-200 text-center min-h-55"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                  <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                  Create New Workspace
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-50 leading-relaxed">
                  Setup a new environment for your next big project.
                </p>
              </button></>}
        </div>

        <div className="mt-20 text-center text-[12px] font-medium text-gray-400">
          © {new Date().getFullYear()} Boarda. All rights reserved.
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default WorkspaceList;
