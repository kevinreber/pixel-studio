import * as React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { NavProgressBar } from "./NavProgressBar";

interface AppShellProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    credits: number;
  } | null;
  isAdmin: boolean;
  whatsNewCount?: number;
  children: React.ReactNode;
}

/**
 * App-wide shell: desktop sidebar (252px) + sticky top bar +
 * mobile top bar + bottom tab nav. Logged-out users still see the shell
 * (Explore is public), but the credits card and account row hide.
 */
export function AppShell({ user, isAdmin, whatsNewCount, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <NavProgressBar />
      <Sidebar user={user} isAdmin={isAdmin} whatsNewCount={whatsNewCount} />
      <MobileNav user={user} isAdmin={isAdmin} />
      <div className="md:pl-[252px]">
        <TopBar isLoggedIn={!!user} />
        <main className="pb-24 pt-14 md:pb-10 md:pt-0">
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
