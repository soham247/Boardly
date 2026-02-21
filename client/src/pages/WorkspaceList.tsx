import { useEffect, useState } from "react";
import { getWorkspaces } from "../lib/api";
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal";
import { useAuthStore } from "../store/auth-store";
import { Plus } from "lucide-react";
import { WorkspaceCard } from "@/components/WorkspaceCard";

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  owner: string;
  members?: string[];
}

const WorkspaceList = () => {
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.data.workspaces || []);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
      if (user?.id === "dev-user-id") {
        setWorkspaces([
          {
            _id: "1",
            name: "Personal",
            slug: "personal",
            owner: "dev-user-id",
            members: [],
          },
          {
            _id: "2",
            name: "Dev Team",
            slug: "dev-team",
            owner: "dev-user-id",
            members: ["1", "2", "3", "4", "5"],
          },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
            My Workspaces
          </h1>
          <p className="text-gray-500 max-w-lg leading-relaxed text-[15px]">
            Select a workspace to continue where you left off, or start a new
            journey with your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace._id} workspace={workspace} />
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="group h-full flex flex-col items-center justify-center p-6 border-[1.5px] border-dashed border-gray-200 rounded-xl bg-gray-50/30 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-center min-h-55"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">
              Create New Workspace
            </h3>
            <p className="text-[13px] text-gray-500 max-w-50 leading-relaxed">
              Setup a new environment for your next big project.
            </p>
          </button>
        </div>

        <div className="mt-20 text-center text-[12px] font-medium text-gray-400">
          © {new Date().getFullYear()} Boarda. All rights reserved.
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkspaces}
      />
    </div>
  );
};

export default WorkspaceList;
