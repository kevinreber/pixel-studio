import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  useNavigation,
  Form,
  Link,
} from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import {
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
} from "~/services/blog.server";
import { generateSlug } from "~/utils/slug";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Tag,
  Settings,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";

const BlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.enum(["tutorial", "guide", "news", "tips"]),
  tags: z.string().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const { postId } = params;

  // New post
  if (postId === "new") {
    return json({ post: null, isNew: true, userId: user.id });
  }

  // Existing post
  const post = await getBlogPostById(postId!);
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ post, isNew: false, userId: user.id });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const { postId } = params;

  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    coverImage: formData.get("coverImage") || undefined,
    category: formData.get("category"),
    tags: formData.get("tags") || undefined,
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    status: formData.get("status"),
  };

  const result = BlogPostSchema.safeParse(rawData);

  if (!result.success) {
    return json(
      {
        success: false as const,
        errors: {
          ...result.error.flatten().fieldErrors,
          _form: undefined as string[] | undefined,
        },
      },
      { status: 400 }
    );
  }

  const { tags, ...data } = result.data;
  const parsedTags = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  try {
    if (postId === "new") {
      // Create new post
      const post = await createBlogPost({
        ...data,
        tags: parsedTags,
        authorId: user.id,
        coverImage: data.coverImage || undefined,
        excerpt: data.excerpt || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      });
      return redirect(`/admin/blog/${post.id}`);
    } else {
      // Update existing post
      await updateBlogPost(postId!, {
        ...data,
        tags: parsedTags,
        coverImage: data.coverImage || undefined,
        excerpt: data.excerpt || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
      });
      return json({ success: true, message: "Post saved successfully" });
    }
  } catch (error) {
    console.error("Error saving blog post:", error);
    return json(
      {
        success: false as const,
        errors: {
          _form: ["Failed to save post"] as string[],
          title: undefined as string[] | undefined,
          slug: undefined as string[] | undefined,
          content: undefined as string[] | undefined,
        },
      },
      { status: 500 }
    );
  }
}

// Type guard to check if action data has errors
function hasErrors(
  data: unknown
): data is { success: false; errors: Record<string, string[] | undefined> } {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    data.success === false &&
    "errors" in data
  );
}

export default function AdminBlogEditor() {
  const { post, isNew } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [autoSlug, setAutoSlug] = useState(isNew);

  // Extract errors safely
  const errors = hasErrors(actionData) ? actionData.errors : null;

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      setSlug(generateSlug(title));
    }
  }, [title, autoSlug]);

  return (
    <div className="min-h-screen bg-background">
      <Form method="post" className="space-y-6 p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/blog">
              <Button type="button" variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {isNew ? "New Blog Post" : "Edit Post"}
              </h1>
              <p className="text-muted-foreground">
                {isNew
                  ? "Create a new blog post or tutorial"
                  : `Editing: ${post?.title}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && post?.status === "published" && (
              <Link to={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                <Button type="button" variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live
                </Button>
              </Link>
            )}
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {actionData && "message" in actionData && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg">
            {actionData.message}
          </div>
        )}
        {errors?._form && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {errors._form.join(", ")}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Post Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="How to Create Stunning AI Art"
                    required
                  />
                  {errors?.title && (
                    <p className="text-sm text-destructive">
                      {errors.title.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">URL Slug *</Label>
                    {isNew && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoSlug(!autoSlug)}
                      >
                        {autoSlug ? "Edit manually" : "Auto-generate"}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/blog/</span>
                    <Input
                      id="slug"
                      name="slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setAutoSlug(false);
                      }}
                      placeholder="how-to-create-stunning-ai-art"
                      required
                    />
                  </div>
                  {errors?.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.join(", ")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    defaultValue={post?.excerpt || ""}
                    placeholder="A brief description of the post for listings and SEO..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 500 characters. Used in post listings and meta description.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content *</CardTitle>
                <CardDescription>
                  Write your post content using Markdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={post?.content || ""}
                  placeholder="# Introduction

Write your blog post content here using Markdown...

## Getting Started

You can use **bold**, *italic*, and other formatting.

- Bullet points
- Work great too

```javascript
// Code blocks are supported
const greeting = 'Hello, AI Art!';
```"
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
                {errors?.content && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.content.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Publish
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={post?.status || "draft"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={post?.category || "tutorial"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="tips">Tips & Tricks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {post && (
                  <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                    <p>Views: {post.viewCount.toLocaleString()}</p>
                    <p>
                      Created:{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    {post.publishedAt && (
                      <p>
                        Published:{" "}
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Cover Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Image URL</Label>
                  <Input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    defaultValue={post?.coverImage || ""}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {post?.coverImage && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={post.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={post?.tags.join(", ") || ""}
                    placeholder="AI art, tutorial, beginner"
                  />
                </div>
                {post?.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO
                </CardTitle>
                <CardDescription>
                  Customize how this post appears in search results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    defaultValue={post?.metaTitle || ""}
                    placeholder="Custom title for search engines"
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 70 characters. Falls back to post title.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    defaultValue={post?.metaDescription || ""}
                    placeholder="Custom description for search engines"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 160 characters. Falls back to excerpt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
