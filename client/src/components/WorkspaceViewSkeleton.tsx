import { Skeleton } from "./ui/skeleton";

export function WorkspaceViewSkeleton() {
    return (<div className="block"> <div className="h-full bg-card border border-border rounded-xl p-6 relative flex flex-col">

        {/* top section */}
        <div className="flex justify-between items-start mb-6">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="w-4 h-4 rounded" />
        </div>

        {/* title + meta */}
        <div className="mb-6 grow text-left space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>

        {/* footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">

            {/* avatars */}
            <div className="flex -space-x-1.5">
                <Skeleton className="w-6 h-6 rounded-full border-2 border-background" />
                <Skeleton className="w-6 h-6 rounded-full border-2 border-background" />
                <Skeleton className="w-6 h-6 rounded-full border-2 border-background" />
            </div>

            {/* activity indicator */}
            <div className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-3 w-20" />
            </div>
        </div>

    </div>
    </div>


    );
}
