import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { prisma } from "~/services/prisma.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Coins,
  Search,
  Plus,
  Minus,
  UserCog,
  History,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchedUser {
  id: string;
  username: string | null;
  email: string;
  image: string | null;
  credits: number;
  createdAt: string;
  _count: {
    images: number;
    generationLogs: number;
  };
}


export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q")?.trim() || "";

  // Search users if query provided
  let searchResults: SearchedUser[] = [];
  if (searchQuery.length >= 2) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            images: true,
            generationLogs: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    searchResults = users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  // Get recent admin adjustments
  const recentAdjustments = await prisma.creditTransaction.findMany({
    where: { type: "admin_adjustment" },
    select: {
      id: true,
      amount: true,
      description: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return json({
    searchQuery,
    searchResults,
    recentAdjustments: recentAdjustments.map((adj) => ({
      ...adj,
      createdAt: adj.createdAt.toISOString(),
    })),
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  // This action is only used for revalidation after credit adjustment
  return json({ success: true });
}

export default function AdminTokensPage() {
  const { searchQuery, searchResults, recentAdjustments } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const searchFetcher = useFetcher<typeof loader>();
  const adjustFetcher = useFetcher<{
    success?: boolean;
    error?: string;
    message?: string;
    user?: { previousCredits: number; newCredits: number };
  }>();

  const isSearching = searchFetcher.state === "loading";
  const isAdjusting = adjustFetcher.state === "submitting";

  // Use fetcher results for search or fall back to loader data
  const displayResults =
    searchFetcher.data?.searchResults ?? searchResults;

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchParams((prev) => {
      if (query.length >= 2) {
        prev.set("q", query);
      } else {
        prev.delete("q");
      }
      return prev;
    });

    if (query.length >= 2) {
      searchFetcher.load(`/admin/tokens?q=${encodeURIComponent(query)}`);
    }
  };

  // Handle user selection for credit adjustment
  const handleSelectUser = (user: SearchedUser, type: "add" | "remove") => {
    setSelectedUser(user);
    setAdjustmentType(type);
    setAmount("");
    setReason("");
    setIsDialogOpen(true);
  };

  // Handle credit adjustment submission
  const handleAdjustCredits = () => {
    if (!selectedUser || !amount || !reason.trim()) return;

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const finalAmount = adjustmentType === "remove" ? -numAmount : numAmount;

    adjustFetcher.submit(
      {
        userId: selectedUser.id,
        amount: finalAmount.toString(),
        reason: reason.trim(),
      },
      {
        method: "POST",
        action: "/api/admin/users/credits",
        encType: "application/json",
      }
    );
  };

  // Handle adjustment result
  useEffect(() => {
    if (adjustFetcher.data?.success) {
      setIsDialogOpen(false);
      setSelectedUser(null);
      setAmount("");
      setReason("");
      // Reload the page data to show updated user credits and recent adjustments
      searchFetcher.load(
        `/admin/tokens${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustFetcher.data]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Token Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Search for users and manually adjust their credit balance
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search by username or email to find a user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              defaultValue={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results */}
          {displayResults.length > 0 && (
            <div className="mt-4 border rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
              {displayResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.username ?? "User"}
                    />
                    <AvatarFallback>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {user.username || "No username"}
                      </span>
                      <Badge
                        variant={user.credits > 0 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {user.credits} credits
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user._count.generationLogs} generations ·{" "}
                      {user._count.images} images
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectUser(user, "add")}
                      className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectUser(user, "remove")}
                      className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      disabled={user.credits === 0}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && displayResults.length === 0 && !isSearching && (
            <div className="mt-4 text-center text-muted-foreground py-8">
              No users found matching &quot;{searchQuery}&quot;
            </div>
          )}

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="mt-4 text-center text-muted-foreground py-4 text-sm">
              Enter at least 2 characters to search
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Admin Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Admin Adjustments
          </CardTitle>
          <CardDescription>
            History of manual credit adjustments made by admins
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentAdjustments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No admin adjustments yet
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentAdjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      adj.amount > 0
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    {adj.amount > 0 ? (
                      <Plus className="h-4 w-4 text-green-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={adj.user.image ?? undefined}
                      alt={adj.user.username ?? "User"}
                    />
                    <AvatarFallback>
                      {adj.user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {adj.user.username || adj.user.email}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {adj.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        adj.amount > 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {adj.amount > 0 ? "+" : ""}
                      {adj.amount}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(adj.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjustment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentType === "add" ? (
                <>
                  <Plus className="h-5 w-5 text-green-600" />
                  Add Credits
                </>
              ) : (
                <>
                  <Minus className="h-5 w-5 text-red-600" />
                  Remove Credits
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === "add"
                ? "Add credits to this user's account"
                : "Remove credits from this user's account"}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedUser.image ?? undefined}
                    alt={selectedUser.username ?? "User"}
                  />
                  <AvatarFallback>
                    {selectedUser.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedUser.username || "No username"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <Badge variant="secondary">
                  <Coins className="h-3 w-3 mr-1" />
                  {selectedUser.credits} credits
                </Badge>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount to {adjustmentType === "add" ? "add" : "remove"}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={
                    adjustmentType === "remove"
                      ? selectedUser.credits
                      : undefined
                  }
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {adjustmentType === "remove" && (
                  <p className="text-xs text-muted-foreground">
                    Maximum: {selectedUser.credits} credits
                  </p>
                )}
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (required)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for this adjustment..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Preview */}
              {amount && parseInt(amount, 10) > 0 && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Preview:</p>
                  <p className="text-muted-foreground">
                    {selectedUser.credits} credits{" "}
                    {adjustmentType === "add" ? "+" : "-"} {amount} ={" "}
                    <span className="font-medium text-foreground">
                      {adjustmentType === "add"
                        ? selectedUser.credits + parseInt(amount, 10)
                        : selectedUser.credits - parseInt(amount, 10)}{" "}
                      credits
                    </span>
                  </p>
                </div>
              )}

              {/* Error Message */}
              {adjustFetcher.data?.error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {adjustFetcher.data.error}
                </div>
              )}

              {/* Success Message */}
              {adjustFetcher.data?.success && (
                <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {adjustFetcher.data.message}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isAdjusting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCredits}
              disabled={
                !amount ||
                parseInt(amount, 10) <= 0 ||
                !reason.trim() ||
                isAdjusting
              }
              className={cn(
                adjustmentType === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isAdjusting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {adjustmentType === "add" ? (
                    <Plus className="h-4 w-4 mr-2" />
                  ) : (
                    <Minus className="h-4 w-4 mr-2" />
                  )}
                  {adjustmentType === "add" ? "Add" : "Remove"} Credits
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
