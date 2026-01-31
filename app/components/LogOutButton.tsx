import { useSubmit } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import posthog from "posthog-js";

const LogOutButton = ({
  variant = "outline",
}: {
  variant?: "outline" | "default";
}) => {
  const submit = useSubmit();

  const handleLogout = () => {
    // Reset PostHog identity before logout to clear user session
    try {
      posthog.reset();
    } catch {
      // Silently fail - analytics shouldn't block logout
    }
    submit(null, { method: "POST", action: "/auth/v2/logout" });
  };

  return (
    <Button
      onClick={handleLogout}
      className="w-full rounded-md p-2 hover:bg-gray-800"
      variant={variant}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  );
};

export { LogOutButton };
