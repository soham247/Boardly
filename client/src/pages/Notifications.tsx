import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../lib/time';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

export default function Notifications() {
  const navigate = useNavigate();

  const {
    unreadCount,
    allNotifications,
    isLoadingAll,
    fetchNextPage,
    hasMore,
    isFetchingMore,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
        fetchNextPage();
      }
    },
    [hasMore, isFetchingMore, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleScroll, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleScroll]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllAsRead}
            className="flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="space-y-1">
        {isLoadingAll ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-border">
                <Skeleton className="w-2 h-2 mt-2 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </>
        ) : allNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-base font-medium text-foreground mb-1">No notifications yet</h2>
            <p className="text-sm text-muted-foreground">
              When you receive notifications, they'll appear here.
            </p>
          </div>
        ) : (
          <>
            {allNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification._id);
                  }
                }}
                className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                  notification.isRead
                    ? 'border-border bg-background opacity-70 cursor-default'
                    : 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    notification.isRead ? 'bg-muted-foreground/30' : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium leading-tight ${
                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="text-[0.7rem] text-muted-foreground/60 shrink-0 mt-0.5">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {notification.message}
                  </p>
                  {notification.entityType && (
                    <span className="inline-block mt-1.5 text-[0.65rem] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full capitalize">
                      {notification.entityType}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-2" />

            {isFetchingMore && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && allNotifications.length > 0 && (
              <p className="text-center text-xs text-muted-foreground/60 py-4">
                You've seen all notifications
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
