import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../store/auth-store";

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  owner: string;
  members?: string[];
}

export const useWorkspaces = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // FETCH WORKSPACES
  const {
    data: workspaces = [],
    isLoading,
    error,
  } = useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await api.get("/workspaces");
      return res.data.workspaces || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // CREATE WORKSPACE
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const res = await api.post("/workspaces", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  //  DELETE WORKSPACE (FIXED — instant UI update)
  const deleteMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      await api.delete(`/workspaces/${workspaceId}`);
      return workspaceId;
    },

    // optimistic update (instant removal)
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: ["workspaces"] });

      const previous = queryClient.getQueryData<Workspace[]>(["workspaces"]);

      queryClient.setQueryData<Workspace[]>(
        ["workspaces"],
        (old = []) => old.filter((w) => w._id !== workspaceId)
      );

      return { previous };
    },

    // rollback if error
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["workspaces"], context.previous);
      }
    },

    // ensure fresh data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  return {
    workspaces,
    isLoading,
    error,
    createWorkspace: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteWorkspace: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};