import { json, type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import {
  getPublishedBlogPosts,
  getBlogCategories,
  getBlogTags,
} from "~/services/blog.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Tag, Folder, ChevronRight } from "lucide-react";
import {
  generateMetaTags,
  generateBreadcrumbSchema,
  serializeSchema,
  SITE_CONFIG,
} from "~/utils/seo";

export const meta: MetaFunction = () => {
  return generateMetaTags({
    title: "Blog - AI Art Tutorials & Guides",
    description:
      "Learn how to create stunning AI art with our tutorials, guides, and tips. Master DALL-E, Stable Diffusion, Flux, and more AI image generators.",
    url: `${SITE_CONFIG.url}/blog`,
    keywords: [
      "AI art tutorial",
      "how to create AI art",
      "AI image generation guide",
      "DALL-E tutorial",
      "Stable Diffusion guide",
      "Flux AI tips",
      "text to image guide",
    ],
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") as
    | "tutorial"
    | "guide"
    | "news"
    | "tips"
    | null;
  const tag = url.searchParams.get("tag");
  const page = parseInt(url.searchParams.get("page") || "1");
  const take = 12;
  const skip = (page - 1) * take;

  const [postsResult, categories, tags] = await Promise.all([
    getPublishedBlogPosts({
      category: category || undefined,
      tag: tag || undefined,
      skip,
      take,
    }),
    getBlogCategories(),
    getBlogTags(),
  ]);

  return json({
    posts: postsResult.posts,
    total: postsResult.total,
    categories,
    tags: tags.slice(0, 20), // Top 20 tags
    page,
    totalPages: Math.ceil(postsResult.total / take),
    currentCategory: category,
    currentTag: tag,
  });
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    tutorial: "Tutorials",
    guide: "Guides",
    news: "News",
    tips: "Tips & Tricks",
  };
  return labels[category] || category;
}

export default function BlogIndex() {
  const {
    posts,
    total,
    categories,
    tags,
    page,
    totalPages,
    currentCategory,
    currentTag,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_CONFIG.url },
    { name: "Blog", url: `${SITE_CONFIG.url}/blog` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema(breadcrumbSchema),
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-background py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">AI Art Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to create stunning AI-generated art with our tutorials,
              guides, and expert tips. Master the art of AI image generation.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Folder className="h-5 w-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={!currentCategory ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      searchParams.delete("category");
                      searchParams.delete("page");
                      setSearchParams(searchParams);
                    }}
                  >
                    All Posts
                    <Badge variant="outline" className="ml-auto">
                      {total}
                    </Badge>
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.category}
                      variant={currentCategory === cat.category ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        searchParams.set("category", cat.category);
                        searchParams.delete("tag");
                        searchParams.delete("page");
                        setSearchParams(searchParams);
                      }}
                    >
                      {getCategoryLabel(cat.category)}
                      <Badge variant="outline" className="ml-auto">
                        {cat.count}
                      </Badge>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Tags */}
              {tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5" />
                      Popular Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(({ tag, count }) => (
                        <Badge
                          key={tag}
                          variant={currentTag === tag ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-primary/80"
                          onClick={() => {
                            if (currentTag === tag) {
                              searchParams.delete("tag");
                            } else {
                              searchParams.set("tag", tag);
                              searchParams.delete("category");
                            }
                            searchParams.delete("page");
                            setSearchParams(searchParams);
                          }}
                        >
                          {tag} ({count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
              {/* Active Filters */}
              {(currentCategory || currentTag) && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-muted-foreground">Filtering by:</span>
                  {currentCategory && (
                    <Badge variant="secondary">
                      {getCategoryLabel(currentCategory)}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          searchParams.delete("category");
                          setSearchParams(searchParams);
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {currentTag && (
                    <Badge variant="secondary">
                      #{currentTag}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          searchParams.delete("tag");
                          setSearchParams(searchParams);
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      searchParams.delete("category");
                      searchParams.delete("tag");
                      searchParams.delete("page");
                      setSearchParams(searchParams);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Posts Grid */}
              {posts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No posts found</p>
                    {(currentCategory || currentTag) && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          searchParams.delete("category");
                          searchParams.delete("tag");
                          setSearchParams(searchParams);
                        }}
                      >
                        View all posts
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                        {post.coverImage && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {getCategoryLabel(post.category)}
                            </Badge>
                            {post.publishedAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.publishedAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          {post.excerpt && (
                            <CardDescription className="line-clamp-3">
                              {post.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={post.author.image || undefined} />
                                <AvatarFallback>
                                  {(post.author.name || post.author.username)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {post.author.name || post.author.username}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        searchParams.set("page", (page - 1).toString());
                        setSearchParams(searchParams);
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        searchParams.set("page", p.toString());
                        setSearchParams(searchParams);
                      }}
                    >
                      {p}
                    </Button>
                  ))}
                  {page < totalPages && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        searchParams.set("page", (page + 1).toString());
                        setSearchParams(searchParams);
                      }}
                    >
                      Next
                    </Button>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
