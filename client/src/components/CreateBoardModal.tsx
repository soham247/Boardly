import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { createBoard, searchUsers } from "../lib/api";
import { Search, X } from "lucide-react";

const boardSchema = z.object({
  name: z.string().min(1, "Board name is required"),
  description: z.string().optional(),
});

type BoardFormValues = z.infer<typeof boardSchema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
}: CreateBoardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BoardFormValues>({
    resolver: zodResolver(boardSchema),
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await searchUsers(searchQuery);
          setSearchResults(res.data.users);
        } catch (error) {
          console.error("Failed to search users", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUsers([]);
    }
  }, [isOpen, reset]);

  const handleAddUser = (user: any) => {
    if (!selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, { ...user, role: "read" }]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== userId));
  };

  const handleRoleChange = (userId: string, role: string) => {
    setSelectedUsers(
      selectedUsers.map((u) => (u._id === userId ? { ...u, role } : u)),
    );
  };

  const onSubmit = async (data: BoardFormValues) => {
    try {
      setIsLoading(true);
      await createBoard({
        name: data.name,
        description: data.description,
        workspaceId,
        members: selectedUsers.map((u) => ({ userId: u._id, role: u.role })),
      });
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Create new board</h2>
        <p className="text-gray-500 mb-4 text-sm">
          Boards help you organize tasks within your workspace.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. API Development"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Brief description of the board"
            />
          </div>

          <div className="space-y-3 pt-2 relative" ref={searchRef}>
            <Label>Search & Assign Members (Optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.length > 1 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                      onClick={() => handleAddUser(user)}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-[12px] text-gray-500 font-medium">
                            {(user.fullName || user.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No users found
                  </div>
                )}
              </div>
            )}

            {/* Selected Users List */}
            {selectedUsers.length > 0 && (
              <div className="max-h-[160px] overflow-y-auto space-y-2 border border-gray-100 p-2 rounded-md mt-3">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt="avatar"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-[10px] text-gray-500 font-medium">
                            {(user.fullName || user.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-gray-700 font-medium">
                        {user.fullName || user.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                      >
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user._id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
