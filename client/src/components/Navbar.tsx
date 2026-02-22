import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { getWorkspaces } from "../lib/api";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LayoutGrid, Search, Bell, LogOut, User as UserIcon, Settings, CreditCard, ChevronDown } from "lucide-react";

export function Navbar() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [workspaceName, setWorkspaceName] = useState<string>("Select Workspace");
    const [workspaceInitial, setWorkspaceInitial] = useState<string>("W");
    const [workspaces, setWorkspaces] = useState<any[]>([]);

    const pathname = location.pathname;
    const isWorkspacesRoute = pathname.startsWith("/workspaces");

    // Extract workspace ID from URL: /workspaces/123 -> 123
    const workspaceIdMatch = pathname.match(/^\/workspaces\/([a-zA-Z0-9_-]+)$/);
    const workspaceId = workspaceIdMatch ? workspaceIdMatch[1] : null;

    useEffect(() => {
        const fetchWorkspaceInfo = async () => {
            try {
                const res = await getWorkspaces();
                const fetchedWorkspaces = res.data.workspaces || [];
                setWorkspaces(fetchedWorkspaces);

                if (workspaceId) {
                    const current = fetchedWorkspaces.find((w: any) => w._id === workspaceId);
                    if (current) {
                        setWorkspaceName(current.name);
                        setWorkspaceInitial(current.name.charAt(0).toUpperCase());
                    }
                } else if (isWorkspacesRoute) {
                    setWorkspaceName("Select Workspace");
                    setWorkspaceInitial("W");
                }
            } catch (error) {
                console.error("Failed to fetch workspaces for navbar", error);
            }
        };

        if (isAuthenticated && isWorkspacesRoute) {
            fetchWorkspaceInfo();
        }
    }, [workspaceId, isWorkspacesRoute, isAuthenticated]);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    // Determine avatar border based on tier
    // Mock 'user' tier if undefined
    const tier = user?.tier || "Free";
    const avatarBorderClass = tier === "Premium" ? "border-amber-400 border-2" : "border-gray-300 border-[1.5px]";

    const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username || 'jane'}&backgroundColor=f1f5f9`;

    return (
        <nav className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm font-sans">
            <div className="flex items-center gap-6 md:gap-8">
                {/* Logo */}
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
                    <div className="bg-primary/20 text-primary p-1.5 rounded-md">
                        <LayoutGrid className="w-5 h-5 fill-primary" />
                    </div>
                    <span className="font-bold text-[1.35rem] tracking-tight text-gray-900">Boarda</span>
                </Link>

                {/* Workspace Switcher */}
                {isAuthenticated && isWorkspacesRoute && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="hidden md:flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors border-l border-gray-200 pl-6">
                                <div className="w-6 h-6 bg-indigo-500 rounded text-xs text-white flex items-center justify-center font-semibold">
                                    {workspaceInitial}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{workspaceName}</span>
                                <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-1 font-sans rounded-xl p-1 shadow-lg border-gray-100">
                            <DropdownMenuLabel className="font-normal px-2.5 py-2 text-xs text-gray-500 uppercase tracking-wider">
                                Switch Workspace
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-100" />
                            {workspaces.map((ws: any) => (
                                <DropdownMenuItem
                                    key={ws._id}
                                    onClick={() => navigate(`/workspaces/${ws._id}`)}
                                    className="cursor-pointer text-gray-700 px-2.5 py-2 rounded-md focus:bg-gray-50 flex items-center gap-2"
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
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 mr-2">
                            <span className="hover:text-gray-900 cursor-pointer transition-colors">Pricing</span>
                            <span className="hover:text-gray-900 cursor-pointer transition-colors">About us</span>
                            <span className="hover:text-gray-900 cursor-pointer transition-colors">Contact</span>
                        </div>
                        <Button onClick={() => navigate("/signin")} className="bg-primary hover:bg-primary/90 text-white shadow-sm px-6 h-10 font-medium cursor-pointer">
                            Login
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 md:gap-5">
                        <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                            <Search className="w-[1.125rem] h-[1.125rem]" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors relative cursor-pointer mr-1">
                            <Bell className="w-[1.125rem] h-[1.125rem]" />
                            <span className="absolute top-[0.4rem] right-[0.4rem] w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`rounded-full outline-none hover:opacity-90 ${avatarBorderClass} p-0.5 transition-all cursor-pointer`}>
                                    <Avatar className="w-[2.15rem] h-[2.15rem]">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-sm font-medium">{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-1 font-sans rounded-xl p-1 shadow-lg border-gray-100">
                                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-[0.9rem] font-medium leading-none text-gray-900">{user?.fullName || "Jane Doe"}</p>
                                        <p className="text-xs leading-none text-gray-500">{user?.email || "jane@boarda.app"}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-100" />
                                <DropdownMenuItem className="cursor-pointer text-gray-600 px-2.5 py-2 rounded-md focus:bg-gray-50">
                                    <UserIcon className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                                    <span className="text-[0.9rem]">Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-gray-600 px-2.5 py-2 rounded-md focus:bg-gray-50">
                                    <Settings className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                                    <span className="text-[0.9rem]">Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-gray-600 px-2.5 py-2 rounded-md focus:bg-gray-50">
                                    <CreditCard className="mr-2.5 h-[1.1rem] w-[1.1rem] text-gray-500" />
                                    <span className="text-[0.9rem]">Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-100" />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-700 px-2.5 py-2 rounded-md focus:bg-red-50 font-medium">
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
