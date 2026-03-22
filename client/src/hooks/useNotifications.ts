import { useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/auth-store';
import { socket } from '../lib/socket';

export interface Notification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  entityType?: 'card' | 'board' | 'workspace' | 'task';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPage {
  notifications: Notification[];
  pagination: {
    totalNotifications: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

const DROPDOWN_LIMIT = 8;
const PAGE_LIMIT = 10;

type InfiniteNotificationData = {
  pages: NotificationPage[];
  pageParams: unknown[];
};

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Unread count
  const { data: unreadCount = 0, isLoading: isLoadingCount } = useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.count ?? 0;
    },
    enabled: isAuthenticated,
    refetchOnMount: true,
  });

  // Unread notifications for dropdown
  const {
    data: dropdownData,
    isLoading: isLoadingDropdown,
    fetchNextPage: fetchNextDropdownPage,
    hasNextPage: hasMoreDropdown,
    isFetchingNextPage: isFetchingMoreDropdown,
  } = useInfiniteQuery<NotificationPage>({
    queryKey: ['notifications', 'dropdown'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(
        `/notifications?limit=${DROPDOWN_LIMIT}&page=${pageParam}&type=unread`
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: isAuthenticated,
    refetchOnMount: true,
  });

  // All notifications for the notifications page
  const {
    data: allNotificationsData,
    isLoading: isLoadingAll,
    fetchNextPage,
    hasNextPage: hasMore,
    isFetchingNextPage: isFetchingMore,
  } = useInfiniteQuery<NotificationPage>({
    queryKey: ['notifications', 'all'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(
        `/notifications?limit=${PAGE_LIMIT}&page=${pageParam}&type=all`
      );
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled: isAuthenticated,
    refetchOnMount: true,
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await api.put(`/notifications/${notificationId}/read`);
      return res.data.notification as Notification;
    },
    onSuccess: (updated: Notification) => {
      // Remove from unread dropdown
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'dropdown'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.filter((n) => n._id !== updated._id),
            })),
          };
        }
      );

      // Mark as read in the all-notifications list
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'all'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n._id === updated._id ? { ...n, isRead: true } : n
              ),
            })),
          };
        }
      );

      // Decrement unread count
      queryClient.setQueryData<number>(
        ['notifications', 'unread-count'],
        (old) => Math.max(0, (old ?? 0) - 1)
      );
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put('/notifications/read-all');
      return res.data;
    },
    onSuccess: () => {
      // Clear dropdown unread list
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'dropdown'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({ ...page, notifications: [] })),
          };
        }
      );

      // Mark all as read in all-notifications list
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'all'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) => ({ ...n, isRead: true })),
            })),
          };
        }
      );

      // Reset unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], 0);
    },
  });

  // Socket.IO: listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewNotification = (notification: Notification) => {
      // Increment unread count
      queryClient.setQueryData<number>(
        ['notifications', 'unread-count'],
        (old) => (old ?? 0) + 1
      );

      // Prepend to dropdown unread list
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'dropdown'],
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          if (pages.length > 0) {
            pages[0] = {
              ...pages[0],
              notifications: [notification, ...pages[0].notifications],
            };
          }
          return { ...old, pages };
        }
      );

      // Prepend to all-notifications list
      queryClient.setQueryData<InfiniteNotificationData>(
        ['notifications', 'all'],
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          if (pages.length > 0) {
            pages[0] = {
              ...pages[0],
              notifications: [notification, ...pages[0].notifications],
            };
          }
          return { ...old, pages };
        }
      );
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [isAuthenticated, queryClient]);

  const dropdownNotifications =
    dropdownData?.pages.flatMap((p) => p.notifications) ?? [];

  const allNotifications =
    allNotificationsData?.pages.flatMap((p) => p.notifications) ?? [];

  return {
    unreadCount,
    isLoadingCount,

    dropdownNotifications,
    isLoadingDropdown,
    fetchNextDropdownPage,
    hasMoreDropdown,
    isFetchingMoreDropdown,

    allNotifications,
    isLoadingAll,
    fetchNextPage,
    hasMore,
    isFetchingMore,

    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,

    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
