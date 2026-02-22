import { ArrowRight, User, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function WorkspaceCard({ workspace }: { workspace: Record<string, any> }) {
  const memberCount = (workspace.members?.length || 0) + 1;
  const isPersonal = memberCount === 1;

  return (
    <Link
      to={`/workspaces/${workspace._id}`}
      key={workspace._id}
      className="block group"
    >
      <div className="h-full bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 hover:border-gray-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            {isPersonal ? (
              <User className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>

        <div className="mb-6 grow text-left">
          <h3 className="text-[17px] font-bold text-gray-900 mb-1">
            {workspace.name}
          </h3>
          <div className="flex items-center text-[13px] text-gray-500 gap-1.5">
            <span>{isPersonal ? "Private" : "Shared"}</span>
            <span className="text-gray-300">•</span>
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100/80 flex items-center justify-between mt-auto">
          {/* Left side: Avatars */}
          <div className="flex">
            {isPersonal ? (
              <div className="w-6 h-6 rounded-full bg-indigo-50 border-[1.5px] border-white flex items-center justify-center shadow-sm">
                <User className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            ) : (
              <div className="flex -space-x-1.5 shrink-0">
                {[...Array(Math.min(3, memberCount))].map((_, i) => {
                  const colors = [
                    "bg-blue-100 text-blue-600",
                    "bg-emerald-100 text-emerald-600",
                    "bg-amber-100 text-amber-600",
                  ];
                  return (
                    <div
                      key={i}
                      style={{ zIndex: 10 - i }}
                      className={`w-6 h-6 rounded-full border-[1.5px] border-white flex items-center justify-center relative shadow-sm ${colors[i % colors.length]}`}
                    >
                      <User className="w-3.5 h-3.5 opacity-80" />
                    </div>
                  );
                })}
                {memberCount > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-50 border-[1.5px] border-white flex items-center justify-center text-[10px] font-bold text-gray-500 relative z-0 shadow-sm">
                    +{memberCount - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Active Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-gray-500">
            {isPersonal ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 m-0.5 bg-amber-400/80"></span>
                </span>
                Last active 2h ago
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 m-0.5 bg-emerald-500"></span>
                </span>
                Active now
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
