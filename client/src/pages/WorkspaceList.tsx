import { useEffect, useState } from "react";
import { getWorkspaces } from "../lib/api";
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuthStore } from "../store/auth-store";
import { Link } from "react-router-dom";

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  owner: string;
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
            name: "Dev Workspace",
            slug: "dev-workspace",
            owner: "dev-user-id",
          },
          {
            _id: "2",
            name: "Test Project",
            slug: "test-project",
            owner: "dev-user-id",
          },
        ]);
      }
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create Workspace</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (
          <Link to={`/workspaces/${workspace._id}`} key={workspace._id}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">/{workspace.slug}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
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
