import { Skeleton } from "@/components/ui/skeleton";

const ImageGridSkeleton = ({
  numberOfImages = 9,
}: {
  numberOfImages?: number;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 lg:gap-6">
      {Array.from({ length: numberOfImages }).map((_, i) => (
        <div key={i} className="aspect-square relative">
          <Skeleton className="w-full h-full rounded-md bg-gray-700/50" />
        </div>
      ))}
    </div>
  );
};

export default ImageGridSkeleton;
