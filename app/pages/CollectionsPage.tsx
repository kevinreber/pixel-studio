import { Link, useLoaderData, useNavigation } from "@remix-run/react";
// import type { GetUserCollectionsResponse } from "~/server";
import { convertNumberToLocaleString } from "~/utils";
import { PageContainer } from "~/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Pencil, Trash2 } from "lucide-react";

const CollectionsPage = () => {
  const loaderData = useLoaderData<{ data: any }>();
  const collections = loaderData.data.collections || [];

  const navigation = useNavigation();
  const isLoadingData = navigation.state !== "idle";

  return (
    <PageContainer>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Collections</h1>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Collection
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative min-h-[400px]">
              {isLoadingData ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/10">
                  <div className="animate-spin">Loading...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Images</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>
                          <Link
                            to={`/collections/${collection.id}`}
                            className="hover:underline font-medium"
                          >
                            {collection.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-zinc-500">
                          {collection.description}
                        </TableCell>
                        <TableCell className="text-right text-zinc-500">
                          {convertNumberToLocaleString(
                            collection.images.length
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default CollectionsPage;
