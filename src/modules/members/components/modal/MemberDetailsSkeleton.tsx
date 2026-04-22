import { Skeleton } from "@/shared/components/ui/skeleton";
import { 
  DialogHeader 
} from "@/shared/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function MemberDetailsSkeleton() {
  return (
    <>
      <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
        <div className="relative flex flex-row items-center sm:items-stretch gap-3 sm:gap-5 pb-3 sm:pb-5 border-b border-border/40">
          {/* Avatar Skeleton with Spinner */}
          <div className="h-14 w-11 sm:h-[6.5rem] sm:w-[5rem] rounded-lg sm:rounded-xl shrink-0 bg-muted/60 flex items-center justify-center border-2 border-border/10">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground/30" />
          </div>
          
          <div className="flex flex-col items-start justify-center gap-1 sm:gap-2 flex-1">
            {/* Name Skeleton */}
            <Skeleton className="h-6 sm:h-8 w-1/2 sm:w-1/3" />
            
            <div className="flex flex-row flex-wrap items-center gap-1 sm:gap-4 mt-1">
              {/* Badges/Info Skeletons */}
              <Skeleton className="h-4 w-24 sm:w-32" />
              <Skeleton className="hidden sm:block h-4 w-32" />
              <Skeleton className="hidden sm:block h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header/Tabs Simulation */}
        <div className="px-5 sm:px-6 pt-4 mb-4">
          <Skeleton className="h-10 w-full sm:w-[350px] rounded-lg" />
        </div>

        {/* Content Area Simulation */}
        <div className="flex-1 overflow-hidden px-5 sm:px-6 pt-5 pb-6 bg-muted/20 min-h-0">
          <div className="h-full flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
