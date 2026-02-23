import { Skeleton } from "./ui/skeleton";

export const BoardCardSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {

    if (viewMode === "list") {
        return (<div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
            {/* board icon / cover */}
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />

            {/* title + meta */}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>

            {/* members / actions */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </div>
        </div>
        );

    }
    else {

        return (<div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
            {/* cover image area */} <Skeleton className="h-24 w-full rounded-lg" />

            {/* board title */}
            <Skeleton className="h-4 w-2/3" />

            {/* description / meta */}
            <Skeleton className="h-3 w-1/2" />

            {/* footer */}
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-8 w-8 rounded-md" />
            </div>
        </div >

        );
    }
};
