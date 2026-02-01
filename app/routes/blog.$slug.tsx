import { json, type LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  getPublishedBlogPostBySlug,
  getRelatedBlogPosts,
} from "~/services/blog.server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Tag,
  ChevronRight,
  Share2,
} from "lucide-react";
import {
  generateMetaTags,
  generateBreadcrumbSchema,
  serializeSchema,
  SITE_CONFIG,
} from "~/utils/seo";
import { marked } from "marked";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: "Post Not Found | Pixel Studio AI" }];
  }

  const { post } = data;

  return generateMetaTags({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || post.title,
    url: `${SITE_CONFIG.url}/blog/${post.slug}`,
    image: post.coverImage || SITE_CONFIG.defaultImage,
    type: "article",
    author: post.author.name || post.author.username,
    publishedTime: post.publishedAt || undefined,
    keywords: post.tags,
  });
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  // Get related posts
  const relatedPosts = await getRelatedBlogPosts(
    post.id,
    post.category,
    post.tags,
    3
  );

  // Parse markdown content
  const htmlContent = marked.parse(post.content);

  // Estimate reading time (average 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return json({
    post: {
      ...post,
      htmlContent,
      readingTime,
    },
    relatedPosts,
  });
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

// Article schema for structured data
interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
}

export default function BlogPost() {
  const { post, relatedPosts } = useLoaderData<typeof loader>();

  // Generate structured data
  const articleSchema: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name || post.author.username,
      url: `${SITE_CONFIG.url}/profile/${post.author.id}`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_CONFIG.url },
    { name: "Blog", url: `${SITE_CONFIG.url}/blog` },
    { name: post.title, url: `${SITE_CONFIG.url}/blog/${post.slug}` },
  ]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeSchema([articleSchema, breadcrumbSchema]),
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link
              to="/blog"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 py-8">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge variant="outline">{getCategoryLabel(post.category)}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {post.publishedAt &&
                format(new Date(post.publishedAt), "MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {post.readingTime} min read
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {post.viewCount.toLocaleString()} views
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

          {/* Author & Share */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b">
            <Link
              to={`/profile/${post.author.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>
                  {(post.author.name || post.author.username)[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {post.author.name || post.author.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{post.author.username}
                </div>
              </div>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-8 pb-8 border-b">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="hover:bg-primary/20">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/20 mb-8">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold mb-2">
                Ready to create your own AI art?
              </h3>
              <p className="text-muted-foreground mb-4">
                Start generating stunning images with our AI-powered tools.
              </p>
              <Link to="/create">
                <Button size="lg">
                  Start Creating
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                      {related.coverImage && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={related.coverImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2">
                          {getCategoryLabel(related.category)}
                        </Badge>
                        <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                          {related.title}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  );
}
