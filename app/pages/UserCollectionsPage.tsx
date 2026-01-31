import { Await, useLoaderData, useNavigation } from "@remix-run/react";
import type { GetUserCollectionsResponse } from "~/server/getUserCollections";
import { PageContainer } from "~/components";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCollectionDialog } from "~/components/CreateCollectionDialog";
import { CollectionRow } from "~/components/CollectionRow";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { Loader2 } from "lucide-react";

const CollectionsTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-6 w-48 bg-gray-700/50" />
          <Skeleton className="h-6 flex-1 bg-gray-700/50" />
          <Skeleton className="h-6 w-16 bg-gray-700/50" />
          <Skeleton className="h-8 w-20 bg-gray-700/50" />
        </div>
      ))}
    </div>
  );
};

const UserCollectionsPage = () => {
  const { data } = useLoaderData<{
    data: Promise<GetUserCollectionsResponse>;
  }>();

  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Collections</h1>
          <CreateCollectionDialog />
        </div>
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative min-h-[400px]">
              <React.Suspense fallback={<CollectionsTableSkeleton />}>
                <Await
                  resolve={data as Promise<GetUserCollectionsResponse>}
                  errorElement={
                    <div className="p-4 text-red-500">
                      Error loading collections
                    </div>
                  }
                >
                  {(resolvedData) => {
                    return (
                      <>
                        {isNavigating && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          </div>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">
                                Images
                              </TableHead>
                              <TableHead className="w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resolvedData.collections.map((collection) => (
                              <CollectionRow
                                key={collection.id}
                                collection={collection}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    );
                  }}
                </Await>
              </React.Suspense>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default UserCollectionsPage;
