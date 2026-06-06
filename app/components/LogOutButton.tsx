import { useSubmit } from "@remix-run/react";
import { LogOut } from "lucide-react";
import posthog from "posthog-js";

const LogOutButton = ({
  variant = "outline",
}: {
  variant?: "outline" | "default";
}) => {
  const submit = useSubmit();

  const handleLogout = () => {
    try {
      posthog.reset();
    } catch {
      /* analytics shouldn't block logout */
    }
    submit(null, { method: "POST", action: "/auth/v2/logout" });
  };

  // Two visual variants:
  // - "outline" is the redesigned full-button used in standalone slots (e.g. mobile menu).
  // - default keeps a menu-row look used inside the account DropdownMenu.
  if (variant === "outline") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-border-strong bg-surface-2 px-4 py-2.5 text-[13.5px] font-semibold text-fg hover:bg-surface-hover"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-[13.5px] font-medium text-fg hover:bg-surface-hover"
    >
      <LogOut className="h-[16px] w-[16px] text-fg-subtle" />
      Sign out
    </button>
  );
};

export { LogOutButton };
