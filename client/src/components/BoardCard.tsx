import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useBoards } from '../hooks/useBoards';
import { EditBoardModal } from './EditBoardModal';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Member {
  userId: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  role: string;
}

export interface BoardProps {
  _id: string;
  name: string;
  description?: string;
  updatedAt: string;
  members: Member[];
  colorCode?: string;
  createdBy?: string | { _id: string };
  userRole?: string;
}

const defaultColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
];

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `just now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return `yesterday`;
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export interface BoardCardProps {
  board: BoardProps;
  index: number;
  viewMode?: 'grid' | 'list';
  onDelete: (boardId: string) => void;
}

export function BoardCard({ board, index, viewMode = 'grid', onDelete }: BoardCardProps) {
  const navigate = useNavigate();
  const updatedAtText = timeAgo(board.updatedAt);
  const { deleteBoard } = useBoards();

  const topColor = board.colorCode || defaultColors[index % defaultColors.length];

  const displayMembers = board.members.slice(0, 3);
  const extraMembersCount = Math.max(0, board.members.length - 3);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setIsDeleteDialogOpen(false);
      setIsMenuOpen(false);

      const promise = deleteBoard(board._id);

      toast.promise(promise, {
        loading: 'Deleting board...',
        success: () => {
          onDelete(board._id);
          return 'Board deleted successfully';
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) =>
          error?.response?.data?.message || 'Failed to delete board. Only creator can delete it.',
      });

      await promise;
    } finally {
      setIsDeleting(false);
    }
  };

  const hasWriteAccess = board.userRole === 'write' || board.userRole === 'owner';

  /* ================= LIST VIEW ================= */
  if (viewMode === 'list') {
    return (
      <>
        <Card
          className="hover:shadow-md transition-shadow relative flex flex-row items-center justify-between p-4 px-6 h-20 shadow-sm border-gray-200 dark:border-zinc-800 rounded-xl bg-card group cursor-pointer"
          onClick={() => navigate(`/boards/${board._id}`)}
        >
          <div className="flex items-center gap-4 w-1/3">
            <div className={`w-1.5 h-10 ${topColor} rounded-full`}></div>
            <div>
              <h3 className="font-semibold text-base truncate text-left dark:text-gray-100">
                {board.name}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-left">
                Updated {updatedAtText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {displayMembers.map((member, i) => (
                <div
                  key={member.userId._id}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-950 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden z-10"
                  style={{ zIndex: 10 - i }}
                  title={member.userId.fullName || member.userId.username}
                >
                  {member.userId.avatar ? (
                    <img
                      src={member.userId.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {(member.userId.fullName || member.userId.username || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {extraMembersCount > 0 && (
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-950 bg-gray-100 dark:bg-zinc-900 flex items-center justify-center z-0">
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                    +{extraMembersCount}
                  </span>
                </div>
              )}
            </div>

            {hasWriteAccess && (
              <div className="relative" ref={menuRef}>
                <button
                  className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-gray-200 dark:border-zinc-800 z-50 py-1">
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
        <EditBoardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          board={board}
        />
      </>
    );
  }

  /* ================= GRID VIEW ================= */
  return (
    <>
      <Card
        className="p-6 gap-0 hover:shadow-lg transition-all relative h-45 flex flex-col justify-between border-gray-200/80 dark:border-zinc-800 shadow-sm rounded-xl bg-card group cursor-pointer"
        onClick={() => navigate(`/boards/${board._id}`)}
      >
        <div className={`w-8 h-1 shrink-0 ${topColor} rounded-full mb-4`} />

        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-[17px] text-gray-900 dark:text-gray-100 truncate max-w-[85%] text-left">
            {board.name}
          </h3>
        </div>

        <p className="text-[13px] text-gray-400 dark:text-gray-500 font-medium mb-auto flex-1 text-left">
          Updated {updatedAtText}
        </p>

        <div className="flex justify-between items-end mt-2">
          <div className="flex -space-x-2">
            {displayMembers.map((member, i) => (
              <div
                key={member.userId._id}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden z-10"
                style={{ zIndex: 10 - i }}
              >
                {member.userId.avatar ? (
                  <img src={member.userId.avatar} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500 font-medium">
                    {(member.userId.fullName || member.userId.username || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
            ))}

            {extraMembersCount > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
                <span className="text-xs">+{extraMembersCount}</span>
              </div>
            )}
          </div>

          {hasWriteAccess && (
            <div className="relative" ref={menuRef}>
              <button
                className="text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 rounded-md shadow-lg border border-gray-200 dark:border-zinc-800 z-50 py-1">
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      <EditBoardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        board={board}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold"> {board.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
    </>
  );
}
