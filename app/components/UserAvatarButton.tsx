import { Link } from "@remix-run/react";
import {
  CreditCard,
  Settings,
  CircleDollarSign,
  Shield,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { LogOutButton } from "./LogOutButton";
import { useLoggedInUser } from "~/hooks/useLoggedInUser";
import { isUserAdmin, type UserWithRoles } from "~/utils/isAdmin";
import { Avatar, Badge } from "./ps";

const UserAvatarButton = () => {
  const userData = useLoggedInUser();
  const isAdmin = isUserAdmin(userData as UserWithRoles | null);

  const displayName = userData?.name || "Guest";
  const username = userData?.username || "guest";
  const avatarSrc = userData?.image || null;
  const credits = userData?.credits || 0;
  const creditsTextPlural = credits === 1 ? "credit" : "credits";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-1 pr-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="User menu"
        >
          <Avatar name={displayName} src={avatarSrc} size={32} />
          <ChevronDown
            className="h-3.5 w-3.5 text-fg-subtle"
            strokeWidth={2.4}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[260px] rounded-md border border-border-strong bg-surface-2 p-1.5 shadow-pop"
      >
        <DropdownMenuLabel className="px-2 py-2">
          <div className="flex items-center gap-2.5">
            <Avatar name={displayName} src={avatarSrc} size={36} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold text-fg">
                  {displayName}
                </span>
                {isAdmin && (
                  <Badge tone="accent" className="px-1.5 py-0 text-[10px]">
                    <Shield className="h-2.5 w-2.5" strokeWidth={2.4} />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="truncate text-[11.5px] text-fg-subtle">
                @{username}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-sm border border-[var(--border)] bg-surface-3 px-2.5 py-1.5 text-[11.5px] text-fg-muted">
            <span className="flex items-center gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5 text-[var(--accent-text)]" />
              <span className="mono font-semibold text-fg">
                {credits.toLocaleString()}
              </span>{" "}
              {creditsTextPlural}
            </span>
            <Link
              to="/checkout"
              prefetch="intent"
              className="font-semibold text-[var(--accent-text)] hover:underline"
            >
              Buy
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-[var(--border)]" />
        <DropdownMenuGroup>
          {userData?.id && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                to={`/profile/${userData.id}`}
                prefetch="intent"
                className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium text-fg hover:bg-surface-hover"
              >
                <UserIcon className="h-[16px] w-[16px] text-fg-subtle" />
                View profile
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              to="/checkout"
              prefetch="intent"
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium text-fg hover:bg-surface-hover"
            >
              <CreditCard className="h-[16px] w-[16px] text-fg-subtle" />
              Buy credits
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              to="/settings"
              prefetch="intent"
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium text-fg hover:bg-surface-hover"
            >
              <Settings className="h-[16px] w-[16px] text-fg-subtle" />
              Settings
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                to="/admin"
                prefetch="intent"
                className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium text-fg hover:bg-surface-hover"
              >
                <Shield className="h-[16px] w-[16px] text-[var(--accent-text)]" />
                Admin dashboard
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1 bg-[var(--border)]" />
        <DropdownMenuItem className="cursor-pointer p-0">
          <LogOutButton variant="default" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserAvatarButton };
