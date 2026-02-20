import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getBoards, getWorkspaces } from "../lib/api";
import { CreateBoardModal } from "../components/CreateBoardModal";
import { BoardCard } from "../components/BoardCard";
import type { BoardProps } from "../components/BoardCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LayoutGrid, List, Filter, Plus, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/auth-store";

interface Workspace {
  _id: string;
  name: string;
  slug: string;
}

export default function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [boards, setBoards] = useState<BoardProps[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UI states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    "updatedDesc" | "updatedAsc" | "nameAsc"
  >("updatedDesc");

  const { user } = useAuthStore();

  const fetchWorkspaceAndBoards = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      const wsRes = await getWorkspaces();
      const currentWs = wsRes.data.workspaces.find(
        (w: any) => w._id === workspaceId,
      );
      if (currentWs) setWorkspace(currentWs);

      const boardsRes = await getBoards(workspaceId);
      setBoards(boardsRes.data.boards || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Fallback mock data for dev user if API fails
      if (user?.id === "dev-user-id") {
        setBoards([
          {
            _id: "1",
            name: "API Development",
            updatedAt: new Date().toISOString(),
            members: [
              {
                userId: { _id: "u1", fullName: "User 1", username: "u1" },
                role: "write",
              },
              {
                userId: { _id: "u2", fullName: "User 2", username: "u2" },
                role: "read",
              },
            ],
          },
          {
            _id: "2",
            name: "UI Refactor",
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            members: [
              {
                userId: { _id: "u1", fullName: "User 1", username: "u1" },
                role: "write",
              },
            ],
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndBoards();
  }, [workspaceId]);

  // Sorting logic
  const sortedBoards = [...boards].sort((a, b) => {
    if (sortBy === "updatedDesc")
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === "updatedAsc")
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    return 0;
  });

  if (isLoading && boards.length === 0) {
    return <div className="p-8">Loading boards...</div>;
  }

  const handleDeleteBoard = (boardId: string) => {
    setBoards(boards.filter((b) => b._id !== boardId));
  };

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-6xl font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {workspace ? workspace.name : "Workspace"} Boards
            </h1>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              Free Plan
            </span>
          </div>
          <p className="text-gray-500 text-left">
            Manage development, bugs, and release cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-md p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded cursor-pointer ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded cursor-pointer ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="text-gray-600 bg-gray-50 hover:bg-gray-100 border-none px-4 py-2 h-9 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </Button>

            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sort By
                  </div>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "updatedDesc" ? "text-indigo-600 font-medium bg-indigo-50/50" : "text-gray-700"}`}
                    onClick={() => {
                      setSortBy("updatedDesc");
                      setFilterMenuOpen(false);
                    }}
                  >
                    Recently Updated
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "updatedAsc" ? "text-indigo-600 font-medium bg-indigo-50/50" : "text-gray-700"}`}
                    onClick={() => {
                      setSortBy("updatedAsc");
                      setFilterMenuOpen(false);
                    }}
                  >
                    Oldest First
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "nameAsc" ? "text-indigo-600 font-medium bg-indigo-50/50" : "text-gray-700"}`}
                    onClick={() => {
                      setSortBy("nameAsc");
                      setFilterMenuOpen(false);
                    }}
                  >
                    Alphabetical (A-Z)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* New Board Button */}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 h-9 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Board
          </Button>
        </div>
      </div>

      {/* Boards Grid/List Display */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
        }
      >
        {sortedBoards.map((board, index) => (
          <BoardCard
            key={board._id}
            board={board}
            index={index}
            viewMode={viewMode}
            onDelete={handleDeleteBoard}
            onUpdate={fetchWorkspaceAndBoards}
          />
        ))}

        {/* Create New Board Card inside Grid/List */}
        <Card
          className={`border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer flex items-center justify-center shadow-none rounded-xl ${viewMode === "grid" ? "flex-col p-6 h-[180px]" : "p-4 flex-row gap-3 h-auto"}`}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <div
            className={`rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm ${viewMode === "grid" ? "w-12 h-12 mb-4" : "w-8 h-8"}`}
          >
            <Plus className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-700 text-sm">
            Create new board
          </span>
        </Card>
      </div>

      {/* Footer text */}
      <div className="mt-12 text-center items-center justify-center flex text-sm text-gray-400">
        <p>
          Showing {boards.length + 1} of {boards.length + 1} items in{" "}
          {workspace?.name || "Workspace"}
        </p>
      </div>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchWorkspaceAndBoards}
        workspaceId={workspaceId!}
      />
    </div>
  );
}
