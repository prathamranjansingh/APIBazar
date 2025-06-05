import { Skeleton } from "@/components/ui/skeleton"

const ApiDetailsLoading = () => {
  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-6 sm:h-8 w-full sm:w-64 mb-2" />
            <Skeleton className="h-3 sm:h-4 w-full sm:w-32" />
          </div>
          <Skeleton className="h-8 sm:h-10 w-full sm:w-28 mt-2 sm:mt-0" />
        </div>
        <Skeleton className="h-24 sm:h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Skeleton className="h-60 sm:h-72 w-full" />
          </div>
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Skeleton className="h-80 sm:h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiDetailsLoading
