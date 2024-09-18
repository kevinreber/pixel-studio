// import { SocialsProvider } from "remix-auth-socials";
import { Form, useSearchParams } from "@remix-run/react";
import { Button } from "../../@/components/ui/button";
// import { Button } from "@/components/ui/button";

// const GOGLE_ACTION_STRING = `/api/auth/${SocialsProvider.GOOGLE}`;
const GOGLE_ACTION_STRING = `/api/auth/google`;

const GoogleLoginButton = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";

  return (
    <div className="px-6 sm:px-0">
      <Form method="POST" action={GOGLE_ACTION_STRING}>
        <input type="hidden" name="intent" value="user-log-in" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button
          type="submit"
          // className="border-solid border-gray-600 flex w-full items-center justify-center gap-3 rounded-md bg-[#24292F] px-3 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24292F]"
          variant="outline"
          className="w-full"
        >
          <svg
            className="mr-2 -ml-1 w-4 h-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Google
        </Button>
      </Form>
    </div>
  );
};

export default GoogleLoginButton;
