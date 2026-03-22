import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../lib/time';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ModeToggle } from './mode-toggle';
import {
  LayoutGrid,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  CreditCard,
  ChevronDown,
  CheckCheck,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaceName, setWorkspaceName] = useState<string>('Select Workspace');
  const [workspaceInitial, setWorkspaceInitial] = useState<string>('W');
  const { workspaces } = useWorkspaces();

  const {
    unreadCount,
    dropdownNotifications,
    isLoadingDropdown,
    fetchNextDropdownPage,
    hasMoreDropdown,
    isFetchingMoreDropdown,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications();

  // Infinite scroll sentinel ref for notification dropdown
  const dropdownSentinelRef = useRef<HTMLDivElement>(null);

  const handleDropdownScroll = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMoreDropdown && !isFetchingMoreDropdown) {
        fetchNextDropdownPage();
      }
    },
    [hasMoreDropdown, isFetchingMoreDropdown, fetchNextDropdownPage]
  );

  useEffect(() => {
    const sentinel = dropdownSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleDropdownScroll, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleDropdownScroll]);

  const pathname = location.pathname;
  const isWorkspacesRoute = pathname.startsWith('/workspaces');

  // Extract workspace ID from URL: /workspaces/123 -> 123
  const workspaceIdMatch = pathname.match(/^\/workspaces\/([a-zA-Z0-9_-]+)$/);
  const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : null;

  useEffect(() => {
    if (isAuthenticated && isWorkspacesRoute) {
      if (workspaceId) {
        const current = workspaces.find((w: any) => w._id === workspaceId);
        if (current) {
          setWorkspaceName(current.name);
          setWorkspaceInitial(current.name.charAt(0).toUpperCase());
        }
      } else {
        setWorkspaceName('Select Workspace');
        setWorkspaceInitial('W');
      }
    }
  }, [workspaceId, isWorkspacesRoute, isAuthenticated, workspaces]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tier = user?.tier || 'Free';
  const avatarBorderClass =
    tier === 'Premium' ? 'border-amber-400 border-2' : 'border-border border-[1.5px]';

  const avatarUrl =
    user?.avatar ||
    `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'jane'}&backgroundColor=f1f5f9`;

  return (
    <nav className="w-full bg-background border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm font-sans">
      <div className="flex items-center gap-6 md:gap-8">
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="bg-primary/20 text-primary p-1.5 rounded-md">
            <LayoutGrid className="w-5 h-5 fill-primary" />
          </div>
          <span className="font-bold text-[1.35rem] tracking-tight">Boarda</span>
        </Link>

        {/* Workspace Switcher */}
        {isAuthenticated && isWorkspacesRoute && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="hidden md:flex items-center gap-2 cursor-pointer hover:bg-card px-3 py-1.5 rounded-md transition-colors border-l border-border pl-6">
                <div className="w-6 h-6 bg-indigo-500 rounded text-xs text-white flex items-center justify-center font-semibold">
                  {workspaceInitial}
                </div>
                <span className="text-sm font-medium text-foreground/50">{workspaceName}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 mt-1 font-sans rounded-xl p-1 shadow-lg border-border"
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2 text-xs text-gray-500 uppercase tracking-wider">
                Switch Workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {workspaces.map((ws: any) => (
                <DropdownMenuItem
                  key={ws._id}
                  onClick={() => navigate(`/workspaces/${ws._id}`)}
                  className="cursor-pointer text-foreground/50 px-2.5 py-2 rounded-md flex items-center gap-2"
                >
                  <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded text-[10px] flex items-center justify-center font-bold">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[0.9rem] font-medium">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">
                Pricing
              </span>
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">
                About us
              </span>
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">
                Contact
              </span>
            </div>
            <ModeToggle />
            <Button
              onClick={() => navigate('/signin')}
              className="bg-primary hover:bg-primary/90 text-white shadow-sm px-6 h-10 font-medium cursor-pointer"
            >
              Login
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <Search className="w-4.5 h-4.5" />
            </button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative cursor-pointer mr-1">
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-[0.4rem] right-[0.4rem] min-w-[0.9rem] h-[0.9rem] bg-red-500 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center text-[0.55rem] text-white font-bold px-[0.15rem]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 mt-1 font-sans rounded-xl p-0 shadow-lg border-border overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <DropdownMenuLabel className="p-0 text-sm font-semibold text-foreground">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        markAllAsRead();
                      }}
                      disabled={isMarkingAllAsRead}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-[22rem] overflow-y-auto">
                  {isLoadingDropdown ? (
                    <div className="space-y-1 p-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 p-2 rounded-lg animate-pulse">
                          <div className="w-2 h-2 mt-2 rounded-full bg-muted shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-2.5 bg-muted rounded w-full" />
                            <div className="h-2 bg-muted rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : dropdownNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">You're all caught up!</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        No unread notifications
                      </p>
                    </div>
                  ) : (
                    <>
                      {dropdownNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          onClick={() => markAsRead(notification._id)}
                          className="flex gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors border-b border-border/40 last:border-0"
                        >
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-tight truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[0.68rem] text-muted-foreground/60 mt-1">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {/* Infinite scroll sentinel */}
                      <div ref={dropdownSentinelRef} className="h-1" />
                      {isFetchingMoreDropdown && (
                        <div className="flex justify-center py-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border px-4 py-2.5">
                  <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                    <Link
                      to="/notifications"
                      className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      See all notifications
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`rounded-full outline-none hover:opacity-90 ${avatarBorderClass} p-0.5 transition-all cursor-pointer`}
                >
                  <Avatar className="w-[2.15rem] h-[2.15rem]">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-sm font-medium">
                      {user?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-1 font-sans rounded-xl p-1 shadow-lg border-border"
              >
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-[0.9rem] font-medium leading-none text-foreground/80">
                      {user?.fullName || 'Jane Doe'}
                    </p>
                    <p className="text-xs leading-none text-gray-500">
                      {user?.email || 'jane@boarda.app'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer text-foreground/80 px-2.5 py-2 rounded-md focus:bg-card"
                >
                  <UserIcon className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                  <span className="text-[0.9rem]">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-foreground/80 px-2.5 py-2 rounded-md focus:bg-card">
                  <Settings className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                  <span className="text-[0.9rem]">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer text-foreground/80 px-2.5 py-2 rounded-md focus:bg-card">
                  <CreditCard className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                  <span className="text-[0.9rem]">Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-700 px-2.5 py-2 rounded-md focus:bg-card font-medium"
                >
                  <LogOut className="mr-2.5 h-[1.1rem] w-[1.1rem]" />
                  <span className="text-[0.9rem]">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
