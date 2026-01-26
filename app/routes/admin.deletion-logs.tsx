import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services/auth.server";
import { getUserWithRoles, isAdmin } from "~/server/isAdmin.server";
import { getImageDeletionLogs } from "~/services/imageDeletionLog.server";
import { prisma } from "~/services/prisma.server";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye, User, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUserLogin(request);
  const userWithRoles = await getUserWithRoles(user.id);

  if (!isAdmin(userWithRoles)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const offset = (page - 1) * PAGE_SIZE;

  const [logs, totalCount] = await Promise.all([
    getImageDeletionLogs({ limit: PAGE_SIZE, offset }),
    prisma.imageDeletionLog.count(),
  ]);

  // Fetch usernames for image owners
  const ownerIds = [...new Set(logs.map((log) => log.imageUserId))];
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, username: true },
  });
  const ownerMap = new Map(owners.map((o) => [o.id, o.username]));

  const logsWithOwners = logs.map((log) => ({
    ...log,
    imageOwnerUsername: ownerMap.get(log.imageUserId) || "Unknown",
  }));

  return json({
    logs: logsWithOwners,
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
  });
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

interface DeletionLog {
  id: string;
  imageId: string;
  imageTitle: string | null;
  imagePrompt: string;
  imageModel: string | null;
  imageUserId: string;
  imageCreatedAt: string | Date;
  deletedBy: string;
  deletedByUser: { id: string; username: string; email: string } | null;
  reason: string | null;
  deletedAt: string | Date;
  metadata: Record<string, unknown> | null;
  imageOwnerUsername: string;
}

function DeletionLogRow({ log }: { log: DeletionLog }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-accent/30 transition-colors">
      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">
            {log.imageTitle || truncate(log.imagePrompt, 50)}
          </span>
          {log.imageModel && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {log.imageModel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            to={`/profile/${log.imageUserId}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <User className="w-3 h-3" />
            {log.imageOwnerUsername}
          </Link>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(log.deletedAt)}
          </span>
        </div>
      </div>

      {/* Deleted By */}
      <div className="hidden md:block text-sm text-muted-foreground w-32 shrink-0">
        <span className="text-xs uppercase tracking-wide block mb-0.5">
          Deleted by
        </span>
        {log.deletedByUser ? (
          <Link
            to={`/profile/${log.deletedByUser.id}`}
            className="font-medium text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {log.deletedByUser.username}
          </Link>
        ) : (
          <span className="font-medium text-foreground">Unknown</span>
        )}
      </div>

      {/* Reason */}
      <div className="hidden lg:block text-sm text-muted-foreground w-40 shrink-0">
        {log.reason ? (
          <span className="flex items-start gap-1">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="truncate">{truncate(log.reason, 30)}</span>
          </span>
        ) : (
          <span className="text-zinc-400 italic">No reason provided</span>
        )}
      </div>

      {/* View Details */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="shrink-0">
            <Eye className="w-4 h-4 mr-1" />
            Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deletion Log Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Image Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Original Image
              </h4>
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                {log.imageTitle && (
                  <div>
                    <span className="text-sm text-muted-foreground">Title:</span>
                    <p className="font-medium">{log.imageTitle}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Prompt:</span>
                  <p className="font-medium">{log.imagePrompt}</p>
                </div>
                <div className="flex gap-4 flex-wrap text-sm">
                  {log.imageModel && (
                    <div>
                      <span className="text-muted-foreground">Model: </span>
                      <Badge variant="secondary">{log.imageModel}</Badge>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Owner: </span>
                    <Link
                      to={`/profile/${log.imageUserId}`}
                      className="font-medium hover:underline"
                    >
                      {log.imageOwnerUsername}
                    </Link>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created: </span>
                    <span>{formatDate(log.imageCreatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deletion Info */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Deletion Details
              </h4>
              <div className="bg-red-500/10 rounded-lg p-4 space-y-2">
                <div className="flex gap-4 flex-wrap text-sm">
                  <div>
                    <span className="text-muted-foreground">Deleted by: </span>
                    {log.deletedByUser ? (
                      <Link
                        to={`/profile/${log.deletedByUser.id}`}
                        className="font-medium hover:underline"
                      >
                        {log.deletedByUser.username}
                      </Link>
                    ) : (
                      <span className="font-medium">Unknown</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deleted at: </span>
                    <span>{formatDate(log.deletedAt)}</span>
                  </div>
                </div>
                {log.reason && (
                  <div>
                    <span className="text-sm text-muted-foreground">Reason:</span>
                    <p className="font-medium mt-1">{log.reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Generation Parameters
                </h4>
                <div className="bg-accent/50 rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* IDs for Reference */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Reference IDs
              </h4>
              <div className="text-xs text-muted-foreground space-y-1 font-mono">
                <p>Log ID: {log.id}</p>
                <p>Original Image ID: {log.imageId}</p>
                <p>Owner User ID: {log.imageUserId}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDeletionLogs() {
  const { logs, totalCount, page, totalPages } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deletion Logs</CardTitle>
          <CardDescription>
            History of deleted images and videos ({totalCount.toLocaleString()}{" "}
            total)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No deletion logs found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.map((log) => (
                <DeletionLogRow key={log.id} log={log as DeletionLog} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={page <= 1}
              className={cn(page <= 1 && "pointer-events-none opacity-50")}
            >
              <Link
                to={`/admin/deletion-logs?page=${page - 1}`}
                prefetch="intent"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={page >= totalPages}
              className={cn(
                page >= totalPages && "pointer-events-none opacity-50"
              )}
            >
              <Link
                to={`/admin/deletion-logs?page=${page + 1}`}
                prefetch="intent"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
