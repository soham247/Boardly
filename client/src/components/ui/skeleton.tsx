import { cn } from "@/lib/utils";

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-md bg-muted",
                "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
                "before:bg-gradient-to-r before:from-transparent before:via-accent/60 before:to-transparent",
                className
            )}
            {...props}
        />
    );
}
