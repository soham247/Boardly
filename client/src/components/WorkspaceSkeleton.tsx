import { Skeleton } from "./ui/skeleton";
import { BoardCardSkeleton } from "./BoardCardSkeleton";

export const WorkspaceSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    return (<div className="container mx-auto p-6 md:p-8 max-w-6xl">

        <div className="flex justify-between items-center mb-10">
            <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80" />
            </div>

            <div className="flex gap-3">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
            </div>
        </div>

        <div className={
            viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
        }>
            {Array.from({ length: 8 }).map((_, i) => (
                <BoardCardSkeleton key={i} viewMode={viewMode} />
            ))}
        </div>
    </div>

    );
};
