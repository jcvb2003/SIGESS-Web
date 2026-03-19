import { Skeleton } from "@/shared/components/ui/skeleton";
import { 
  DialogHeader 
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

export function MemberDetailsSkeleton() {
  return (
    <>
      <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
        <div className="relative flex flex-row items-center sm:items-stretch gap-3 sm:gap-5 pb-3 sm:pb-5 border-b border-border/40">
          {/* Avatar Skeleton */}
          <Skeleton className="h-14 w-11 sm:h-[6.5rem] sm:w-[5rem] rounded-lg sm:rounded-xl shrink-0" />
          
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

      <Tabs defaultValue="primary" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="px-5 sm:px-6 w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 pt-4 pb-3 sm:pb-0">
          <TabsList className="w-full h-10 overflow-hidden bg-muted/50 border border-border/30">
            <TabsTrigger value="primary" className="flex-1" disabled>
              Dados Principais
            </TabsTrigger>
            <TabsTrigger value="complementary" className="flex-1" disabled>
              Dados Complementares
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden px-5 sm:px-6 pt-4 pb-0 sm:pb-6 bg-muted/20 min-h-0">
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
      </Tabs>
    </>
  );
}
