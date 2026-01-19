/**
 * Prompt Marketplace Page
 *
 * Browse and purchase prompts from other creators
 */

import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { getUserFromRequest } from "~/services/auth.server";
import {
  searchMarketplace,
  getMarketplaceCategories,
  getFeaturedPrompts,
} from "~/services/marketplace.server";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Star,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Prompt Marketplace | Pixel Studio" },
    { name: "description", content: "Discover and purchase proven prompts from top creators" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const sortBy = (url.searchParams.get("sortBy") as "newest" | "popular" | "topRated") || "popular";

  const user = await getUserFromRequest(request);

  const [{ prompts, total }, categories, featured] = await Promise.all([
    searchMarketplace({ query, category, sortBy, limit: 20 }, user?.id),
    getMarketplaceCategories(),
    getFeaturedPrompts(4),
  ]);

  return json({
    prompts,
    total,
    categories,
    featured,
    isLoggedIn: !!user,
  });
}

function PromptCard({
  prompt,
  isLoggedIn,
}: {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    tags: string[];
    price: number;
    purchaseCount: number;
    averageRating: number | null;
    user: { id: string; username: string; image: string | null };
    sampleImageIds: string[];
    isPurchased?: boolean;
  };
  isLoggedIn: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Sample Image Preview */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {prompt.sampleImageIds[0] ? (
          <img
            src={`https://${process.env.S3_BUCKET_NAME || "pixel-studio"}.s3.amazonaws.com/${prompt.sampleImageIds[0]}`}
            alt={prompt.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {prompt.isPurchased && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            Owned
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{prompt.title}</CardTitle>
          <Badge variant="outline" className="capitalize shrink-0">
            {prompt.category}
          </Badge>
        </div>
        {prompt.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{prompt.description}</p>
        )}
      </CardHeader>

      <CardContent className="pb-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {prompt.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{prompt.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            {prompt.purchaseCount}
          </span>
          {prompt.averageRating && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {prompt.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between">
        {/* Creator */}
        <Link
          to={`/user/${prompt.user.username}`}
          className="flex items-center gap-2 hover:underline"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={prompt.user.image || undefined} />
            <AvatarFallback>{prompt.user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">@{prompt.user.username}</span>
        </Link>

        {/* Price/Action */}
        {prompt.isPurchased ? (
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/marketplace/prompts/${prompt.id}`}>View</Link>
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to={isLoggedIn ? `/marketplace/prompts/${prompt.id}` : "/login"}>
              {prompt.price} credits
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FeaturedSection({
  prompts,
}: {
  prompts: Array<{
    id: string;
    title: string;
    price: number;
    purchaseCount: number;
    user: { username: string; image: string | null };
  }>;
}) {
  if (prompts.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Featured Prompts
        </h2>
        <Link to="/marketplace?sortBy=popular" className="text-sm text-primary hover:underline">
          View all <ChevronRight className="h-4 w-4 inline" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <h3 className="font-semibold line-clamp-1">{prompt.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">
                  by @{prompt.user.username}
                </span>
                <Badge>{prompt.price} credits</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function MarketplacePage() {
  const { prompts, total, categories, featured, isLoggedIn } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");

  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sortBy") || "popular";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("query", searchQuery);
    } else {
      params.delete("query");
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category && category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sort);
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Prompt Marketplace</h1>
        <p className="text-muted-foreground text-lg">
          Discover proven prompts from top creators and elevate your generations
        </p>
      </div>

      {/* Featured Section */}
      <FeaturedSection prompts={featured} />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <Select value={currentCategory || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="topRated">Top Rated</SelectItem>
              <SelectItem value="priceAsc">Price: Low to High</SelectItem>
              <SelectItem value="priceDesc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {prompts.length} of {total} prompts
      </p>

      {/* Prompt Grid */}
      {prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No prompts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or browse all categories
          </p>
        </div>
      )}

      {/* Sell CTA */}
      {isLoggedIn && (
        <div className="mt-12 p-8 bg-muted rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Have a great prompt?</h2>
          <p className="text-muted-foreground mb-4">
            Share your creativity and earn credits from other users
          </p>
          <Button asChild size="lg">
            <Link to="/marketplace/sell">Start Selling</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
