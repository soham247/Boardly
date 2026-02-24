import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

export const BoardCardSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    // LIST VIEW (matches h-20 board row)
    if (viewMode === "list") {
        return (<Card className="flex items-center justify-between p-4 px-6 h-20 rounded-xl bg-card border-border">
            {/* Left section */} <div className="flex items-center gap-4 w-1/3"> <Skeleton className="w-1.5 h-10 rounded-full" />

                <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-6">
                {/* avatars */}
                <div className="flex -space-x-2">
                    <Skeleton className="w-7 h-7 rounded-full border-2 border-background" />
                    <Skeleton className="w-7 h-7 rounded-full border-2 border-background" />
                    <Skeleton className="w-7 h-7 rounded-full border-2 border-background" />
                </div>

                {/* menu button */}
                <Skeleton className="w-6 h-6 rounded-md" />
            </div>
        </Card>
        );

    }

    // GRID VIEW (matches real card proportions)
    return (<Card className="p-6 h-45 flex flex-col justify-between rounded-xl bg-card border-border">

        {/* top color bar */}
        <Skeleton className="w-8 h-1 rounded-full mb-4" />

        {/* title + subtitle */}
        <div className="space-y-2 mb-auto">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
        </div>

        {/* bottom */}
        <div className="flex justify-between items-end mt-4">
            <div className="flex -space-x-2">
                <Skeleton className="w-8 h-8 rounded-full border-2 border-background" />
                <Skeleton className="w-8 h-8 rounded-full border-2 border-background" />
                <Skeleton className="w-8 h-8 rounded-full border-2 border-background" />
            </div>

            <Skeleton className="w-7 h-7 rounded-md" />
        </div>
    </Card >

    );
};
