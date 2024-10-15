import { useSubmit } from "@remix-run/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const LogOutButton = ({
  variant = "outline",
}: {
  variant?: "outline" | "default";
}) => {
  const submit = useSubmit();

  const handleLogout = () => {
    submit(null, { method: "POST", action: "/auth/logout" });
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
