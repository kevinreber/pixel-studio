import { NotificationDropdown } from "../NotificationDropdown";
import { UserAvatarButton } from "../UserAvatarButton";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  isLoggedIn: boolean;
}

/**
 * Sticky 58px top utility bar — sits above the main content on desktop.
 * Hosts the notification bell, theme toggle, and account chip.
 */
export function TopBar({ isLoggedIn }: TopBarProps) {
  return (
    <div className="sticky top-0 z-20 hidden h-[58px] items-center border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 backdrop-blur md:flex">
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {isLoggedIn && (
          <>
            <NotificationDropdown />
            <UserAvatarButton />
          </>
        )}
      </div>
    </div>
  );
}
