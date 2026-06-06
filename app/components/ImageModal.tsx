import * as React from "react";
import { Link } from "@remix-run/react";
import {
  MessageCircle,
  Info,
  Download,
  Share2,
  Copy,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LikeImageButton } from "~/components/LikeImageButton";
import { CommentForm } from "~/components/CommentForm";
import { ImageComment } from "~/components/ImageComment";
import { FollowButton } from "~/components/FollowButton";
import { RemixImageButton } from "~/components/RemixImageButton";
import { AddImageToCollectionButton } from "~/components/AddImageToCollectionButton";
import { toast } from "sonner";
import { useLoggedInUser } from "~/hooks";
import { convertUtcDateToLocalDateString, fallbackImageSource } from "~/client";
import { isUserAdmin, type UserWithRoles } from "~/utils/isAdmin";
import type { ImageUserData } from "~/pages/ExploreImageDetailsPage";
import type { ImageDetail } from "~/server/getImage";
import { Avatar, Badge } from "./ps";

interface ImageModalProps {
  imageData: ImageDetail;
  onClose?: () => void;
}

const ImageModal = ({ imageData, onClose }: ImageModalProps) => {
  const imageUserData = imageData!.user as ImageUserData;
  const userData = useLoggedInUser();
  const isUserLoggedIn = Boolean(userData);
  const isAdmin = isUserAdmin(userData as UserWithRoles | null);

  if (!imageData) return null;

  const copyPrompt = () => {
    if (typeof navigator !== "undefined" && imageData.prompt) {
      navigator.clipboard.writeText(imageData.prompt).catch(() => undefined);
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg text-fg md:flex-row">
      {/* Left: image on inset well */}
      <div className="flex flex-1 items-center justify-center bg-surface-inset p-3 md:p-6">
        <img
          src={imageData.url}
          alt={imageData.prompt || "Generated image"}
          className="max-h-[88vh] max-w-full rounded-md object-contain shadow-lg"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== fallbackImageSource) {
              target.src = fallbackImageSource;
            }
          }}
        />
      </div>

      {/* Right: 408px panel */}
      <div className="flex w-full flex-col border-l border-[var(--border)] bg-surface-1 md:h-[88vh] md:w-[408px]">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-4 py-3.5">
          <Avatar
            name={imageUserData?.username}
            src={imageUserData?.image || null}
            size={36}
          />
          <div className="min-w-0 flex-1 leading-tight">
            <Link
              to={`/profile/${imageUserData?.id}`}
              prefetch="intent"
              className="truncate text-[13.5px] font-semibold text-fg hover:underline"
            >
              {imageUserData?.username}
            </Link>
            <div className="truncate text-[11.5px] text-fg-subtle">
              {convertUtcDateToLocalDateString(imageData.createdAt!)}
            </div>
          </div>
          {imageUserData?.id && imageUserData.id !== userData?.id && (
            <FollowButton
              targetUserId={imageUserData.id}
              isFollowing={false}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-[200px] rounded-md border border-border-strong bg-surface-2 p-1.5 shadow-pop"
            >
              <DropdownMenuItem asChild className="cursor-pointer">
                <a
                  href={imageData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] text-fg hover:bg-surface-hover"
                >
                  <Download className="h-4 w-4 text-fg-subtle" /> Open original
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer rounded-sm px-2.5 py-2 text-[13.5px] text-fg hover:bg-surface-hover"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard
                      .writeText(window.location.href)
                      .catch(() => undefined);
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4 text-fg-subtle" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-sm px-2.5 py-2 text-[13.5px] text-fg hover:bg-surface-hover">
                <Info className="mr-2 h-4 w-4 text-fg-subtle" /> Report
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="cursor-pointer rounded-sm px-2.5 py-2 text-[13.5px] text-danger hover:bg-danger-soft">
                  <X className="mr-2 h-4 w-4" /> Admin delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Close button. When onClose is passed (callers that own the
              modal state) we drive their handler. Inside a Radix Dialog the
              ESC key + backdrop click still close, so the Dialog also keeps
              its built-in close behavior; this button is just a visible
              affordance. */}
          <button
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (typeof window !== "undefined") {
                // Fallback: dispatch ESC to bubble up to the parent Dialog.
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" }),
                );
              }
            }}
            className="ml-1 grid h-8 w-8 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Tabs: Info | Comments */}
        <Tabs defaultValue="info" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full shrink-0 grid-cols-2 gap-0 rounded-none border-b border-[var(--border)] bg-transparent p-0">
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13.5px] font-semibold text-fg-subtle data-[state=active]:border-[var(--accent)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-none"
            >
              <Info className="h-4 w-4" /> Info
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent py-3 text-[13.5px] font-semibold text-fg-subtle data-[state=active]:border-[var(--accent)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-none"
            >
              <MessageCircle className="h-4 w-4" />
              Comments
              {imageData.comments && imageData.comments.length > 0 && (
                <span className="mono text-[11px] text-fg-subtle">
                  {imageData.comments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="info"
            className="m-0 flex-1 overflow-y-auto px-4 py-4"
          >
            {/* Prompt */}
            <div className="mb-5 rounded-sm border border-[var(--border)] bg-surface-inset p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="u-label">Prompt</span>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-[var(--accent-text)] hover:underline"
                >
                  <Copy className="h-3 w-3" /> Copy prompt
                </button>
              </div>
              <p className="text-[13.5px] leading-[1.55] text-fg">
                {imageData.prompt || "—"}
              </p>
            </div>

            {/* 2-col metadata grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
              <MetaRow label="Model" value={imageData.model || "—"} />
              <MetaRow
                label="Style"
                value={imageData.stylePreset || "None"}
              />
              <MetaRow
                label="Size"
                value={`${imageData.width || "—"} × ${imageData.height || "—"}`}
                mono
              />
              <MetaRow
                label="Set"
                value={
                  imageData.setId ? (
                    <Link
                      to={`/sets/${imageData.setId}`}
                      prefetch="intent"
                      className="text-[var(--accent-text)] hover:underline"
                    >
                      View set
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <MetaRow
                label="Created"
                value={convertUtcDateToLocalDateString(imageData.createdAt!)}
              />
              <MetaRow
                label="Cost"
                value={
                  <span className="mono inline-flex items-center gap-1 text-fg-subtle">
                    <Badge tone="neutral" className="px-1.5 py-0">
                      credits
                    </Badge>
                  </span>
                }
              />
            </div>
          </TabsContent>

          <TabsContent
            value="comments"
            className="m-0 flex-1 overflow-y-auto px-4 py-4"
          >
            {imageData.comments && imageData.comments.length > 0 ? (
              <ul className="space-y-4">
                {imageData.comments.map((comment) => (
                  <li key={comment.id}>
                    <ImageComment
                      id={comment.id}
                      imageId={imageData.id}
                      message={comment.message}
                      createdAt={comment.createdAt}
                      user={comment.user}
                      likes={comment.likes}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-center text-[13px] text-fg-subtle">
                No comments yet. Be the first.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Action bar — every button is wired to its real component. */}
        <div className="shrink-0 border-t border-[var(--border)] bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <LikeImageButton imageData={imageData} />
            <div className="flex items-center gap-1">
              <RemixImageButton
                imageId={imageData.id as string}
                currentModel={imageData.model ?? null}
              />
              <ActionIcon
                icon={<Download className="h-[18px] w-[18px]" />}
                label="Download"
                href={imageData.url}
              />
              <AddImageToCollectionButton imageId={imageData.id as string} />
              <ActionIcon
                icon={<Share2 className="h-[18px] w-[18px]" />}
                label="Copy link"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const url = `${window.location.origin}/p/${imageData.id}`;
                  navigator.clipboard
                    .writeText(url)
                    .then(() => toast.success("Link copied"))
                    .catch(() => toast.error("Couldn't copy link"));
                }}
              />
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div className="shrink-0 border-t border-[var(--border)] bg-surface-1 px-4 py-3">
          {isUserLoggedIn ? (
            <CommentForm imageId={imageData.id as string} />
          ) : (
            <p className="text-center text-[12.5px] text-fg-subtle">
              Sign in to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="u-label mb-1">{label}</div>
      <div className={mono ? "mono text-fg" : "text-fg"}>{value}</div>
    </div>
  );
}

function ActionIcon({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "grid h-9 w-9 place-items-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={label}
        aria-label={label}
        className={className}
      >
        {icon}
      </a>
    );
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {icon}
    </button>
  );
}

export default ImageModal;
