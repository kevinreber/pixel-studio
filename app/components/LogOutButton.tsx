import { Form } from "@remix-run/react";
// import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useIsPending } from "~/hooks";

const LogOutButton = ({ variant = "outline" }: { variant?: "outline" | "default" }) => {
  const isPending = useIsPending();

  return (
    <Form action="/auth/logout" method="POST">
      <Button
        type="submit"
        className="w-full  rounded-md p-2  hover:bg-gray-800"
        disabled={isPending}
        variant={variant}
      >
        {/* <AuthenticityTokenInput /> */}
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>
    </Form>
  );
};

export { LogOutButton };
