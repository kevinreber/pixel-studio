import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher, useSearchParams } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { getAllBlogPosts, deleteBlogPost } from "~/services/blog.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as "draft" | "published" | "archived" | null;
  const page = parseInt(url.searchParams.get("page") || "1");
  const take = 20;
  const skip = (page - 1) * take;

  const { posts, total } = await getAllBlogPosts({
    status: status || undefined,
    skip,
    take,
  });

  return json({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / take),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const postId = formData.get("postId") as string;
    await deleteBlogPost(postId);
    return json({ success: true });
  }

  return json({ success: false, error: "Unknown action" }, { status: 400 });
}

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "draft":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "archived":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    tutorial: "Tutorial",
    guide: "Guide",
    news: "News",
    tips: "Tips & Tricks",
  };
  return labels[category] || category;
}

export default function AdminBlog() {
  const { posts, total, page, totalPages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status");

  const handleDelete = (postId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      fetcher.submit(
        { intent: "delete", postId },
        { method: "post" }
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">
            Create and manage blog posts and tutorials
          </p>
        </div>
        <Link to="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        <Button
          variant={!currentStatus ? "default" : "outline"}
          size="sm"
          onClick={() => {
            searchParams.delete("status");
            setSearchParams(searchParams);
          }}
        >
          All ({total})
        </Button>
        {["draft", "published", "archived"].map((status) => (
          <Button
            key={status}
            variant={currentStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => {
              searchParams.set("status", status);
              searchParams.delete("page");
              setSearchParams(searchParams);
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Posts
          </CardTitle>
          <CardDescription>
            {total} {total === 1 ? "post" : "posts"} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blog posts found</p>
              <Link to="/admin/blog/new">
                <Button variant="outline" className="mt-4">
                  Create your first post
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          /blog/{post.slug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getCategoryLabel(post.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {post.author.name || post.author.username}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {post.viewCount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/blog/${post.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {post.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Live
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/blog/${post.id}/preview`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(post.id, post.title)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    searchParams.set("page", p.toString());
                    setSearchParams(searchParams);
                  }}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
