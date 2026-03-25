import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useBoards } from '../hooks/useBoards';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { BoardCard } from '../components/BoardCard';
import type { BoardProps } from '../components/BoardCard';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LayoutGrid, List, Filter, Plus, ChevronDown, Users } from 'lucide-react';
import { WorkspaceSkeleton } from '@/components/WorkspaceSkeleton';
import { ManageMembersModal } from '../components/ManageMembersModal';

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  userRole?: 'owner' | 'admin' | 'shared';
}

export default function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, isLoading: isConnecting } = useWorkspaces();
  const [boards, setBoards] = useState<BoardProps[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const { boards: queryBoards, isLoadingBoards } = useBoards(workspaceId);

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'nameAsc'>('updatedDesc');

  useEffect(() => {
    // Only update if the reference changes or length differs to prevent infinite loops
    if (queryBoards && (!boards || boards.length !== queryBoards.length)) {
      setBoards(queryBoards as unknown as BoardProps[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryBoards, boards.length]);

  useEffect(() => {
    if (workspaces && workspaceId) {
      const currentWs = workspaces.find((w: { _id: string }) => w._id === workspaceId);
      if (currentWs) {
        setWorkspace(currentWs as Workspace);
      }
    }
  }, [workspaces, workspaceId]);

  const userRole = workspace?.userRole || 'shared';
  const canCreateBoard = userRole === 'owner' || userRole === 'admin';

  // Sorting logic
  const sortedBoards = [...boards].sort((a, b) => {
    if (sortBy === 'updatedDesc')
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'updatedAsc')
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
    return 0;
  });

  if ((isLoadingBoards || isConnecting) && boards.length === 0) {
    return <WorkspaceSkeleton viewMode={viewMode} />;
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {workspace ? workspace.name : 'Workspace'} Boards
            </h1>
            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
              Free Plan
            </span>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                userRole === 'owner'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : userRole === 'admin'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {userRole}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-left">
            Manage development, bugs, and release cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-md p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded cursor-pointer ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border-none px-4 py-2 h-9 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </Button>

            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-md shadow-lg border border-gray-200 dark:border-zinc-800 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sort By
                  </div>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 ${sortBy === 'updatedDesc' ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => {
                      setSortBy('updatedDesc');
                      setFilterMenuOpen(false);
                    }}
                  >
                    Recently Updated
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 ${sortBy === 'updatedAsc' ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => {
                      setSortBy('updatedAsc');
                      setFilterMenuOpen(false);
                    }}
                  >
                    Oldest First
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 ${sortBy === 'nameAsc' ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={() => {
                      setSortBy('nameAsc');
                      setFilterMenuOpen(false);
                    }}
                  >
                    Alphabetical (A-Z)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Members Button — only for owner/admin */}
          {canCreateBoard && (
            <Button
              variant="outline"
              onClick={() => setIsMembersModalOpen(true)}
              className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border-none px-4 py-2 h-9 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Members
            </Button>
          )}

          {/* New Board Button — only for owner/admin */}
          {canCreateBoard && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 h-9 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Board
            </Button>
          )}
        </div>
      </div>

      {/* Boards Grid/List Display */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
        }
      >
        {sortedBoards.map((board, index) => (
          <BoardCard
            key={board._id}
            board={board}
            index={index}
            viewMode={viewMode}
            onDelete={handleDeleteBoard}
          />
        ))}

        {/* Create New Board Card inside Grid/List — only for owner/admin */}
        {canCreateBoard && (
          <Card
            className={`border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer flex items-center justify-center shadow-none rounded-xl bg-transparent ${viewMode === 'grid' ? 'flex-col p-6 h-45' : 'p-4 flex-row gap-3 h-auto'}`}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div
              className={`rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-gray-100 dark:border-zinc-800 shadow-sm ${viewMode === 'grid' ? 'w-12 h-12 mb-4' : 'w-8 h-8'}`}
            >
              <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
              Create new board
            </span>
          </Card>
        )}
      </div>

      {/* Footer text */}
      <div className="mt-12 text-center items-center justify-center flex text-sm text-gray-400 dark:text-gray-500">
        <p>
          Showing {boards.length + 1} of {boards.length + 1} items in{' '}
          {workspace?.name || 'Workspace'}
        </p>
      </div>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId!}
      />

      <ManageMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        workspaceId={workspaceId!}
        userRole={userRole}
      />
    </div>
  );
}
