import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { deleteBoard } from "../lib/api";
import { EditBoardModal } from "./EditBoardModal";
import { useNavigate } from "react-router-dom";

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
  colorCode?: string; // Optional color for the top bar
  createdBy?: string | { _id: string };
  userRole?: string;
}

const defaultColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
];

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `just now`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return `yesterday`;
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

export interface BoardCardProps {
  board: BoardProps;
  index: number;
  viewMode?: "grid" | "list";
  onDelete: (boardId: string) => void;
  onUpdate: () => void;
}

export function BoardCard({
  board,
  index,
  viewMode = "grid",
  onDelete,
  onUpdate,
}: BoardCardProps) {
  const navigate = useNavigate();
  const updatedAtText = timeAgo(board.updatedAt);

  // Assign a predictable color based on index if not provided
  const topColor =
    board.colorCode || defaultColors[index % defaultColors.length];

  // Show up to 3 avatars, then a +N circle
  const displayMembers = board.members.slice(0, 3);
  const extraMembersCount = Math.max(0, board.members.length - 3);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this board?")) return;
    try {
      setIsDeleting(true);
      await deleteBoard(board._id);
      onDelete(board._id);
    } catch (error: any) {
      console.error("Failed to delete board:", error);
      alert(
        error.response?.data?.message ||
          "Failed to delete board. Only creator can delete it.",
      );
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  const hasWriteAccess =
    board.userRole === "write" || board.userRole === "owner";

  if (viewMode === "list") {
    return (
      <>
        <Card
          className="hover:shadow-md transition-shadow relative flex flex-row items-center justify-between p-4 px-6 h-20 shadow-sm border-gray-200 rounded-xl bg-white group cursor-pointer"
          onClick={() => navigate(`/boards/${board._id}`)}
        >
          <div className="flex items-center gap-4 w-1/3">
            <div className={`w-1.5 h-10 ${topColor} rounded-full`}></div>
            <div>
              <h3 className="font-semibold text-base truncate text-left">
                {board.name}
              </h3>
              <p className="text-xs text-gray-400 text-left">
                Updated {updatedAtText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {displayMembers.map((member, i) => (
                <div
                  key={member.userId._id}
                  className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden z-10"
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
                      {(member.userId.fullName || member.userId.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {extraMembersCount > 0 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center z-0">
                  <span className="text-[10px] text-gray-600 font-medium">
                    +{extraMembersCount}
                  </span>
                </div>
              )}
            </div>

            {hasWriteAccess && (
              <div className="relative" ref={menuRef}>
                <button
                  className="text-gray-300 hover:text-gray-600 hover:bg-gray-100 cursor-pointer p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(!isMenuOpen);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete();
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />{" "}
                      {isDeleting ? "Deleting..." : "Delete"}
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
          onSuccess={() => {
            setIsEditModalOpen(false);
            onUpdate();
          }}
          board={board}
        />
      </>
    );
  }

  return (
    <>
      <Card
        className="p-6 gap-0 hover:shadow-lg transition-all relative h-45 flex flex-col justify-between border-gray-200/80 shadow-sm rounded-xl bg-white group cursor-pointer"
        onClick={() => navigate(`/boards/${board._id}`)}
      >
        <div className={`w-8 h-1 shrink-0 ${topColor} rounded-full mb-4`}></div>

        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-[17px] text-gray-900 truncate max-w-[85%] text-left">
            {board.name}
          </h3>
        </div>

        <p className="text-[13px] text-gray-400 font-medium mb-auto flex-1 text-left">
          Updated {updatedAtText}
        </p>

        <div className="flex justify-between items-end mt-2">
          <div className="flex -space-x-2">
            {displayMembers.map((member, i) => (
              <div
                key={member.userId._id}
                className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden z-10"
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
                  <span className="text-xs text-gray-500 font-medium">
                    {(member.userId.fullName || member.userId.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {extraMembersCount > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center z-0">
                <span className="text-xs text-gray-600 font-medium">
                  +{extraMembersCount}
                </span>
              </div>
            )}
          </div>

          {hasWriteAccess ? (
            <div className="relative" ref={menuRef}>
              <button
                className={`text-gray-300 ${hasWriteAccess ? "hover:text-gray-600 hover:bg-gray-100 cursor-pointer" : "cursor-not-allowed opacity-50"} p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasWriteAccess) {
                    setIsMenuOpen(!isMenuOpen);
                  }
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1 text-left origin-bottom-right">
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 outline-none"
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
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />{" "}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="p-1 px-2 bg-gray-100 text-sm rounded-md">
              Read-only
            </span>
          )}
        </div>
      </Card>

      <EditBoardModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onUpdate();
        }}
        board={board}
      />
    </>
  );
}
