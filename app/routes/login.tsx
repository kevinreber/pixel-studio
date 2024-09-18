import PageContainer from "components/PageContainer";
import PixelStudioIcon from "components/PixelStudioIcon";
import type { LoaderFunctionArgs } from "@remix-run/node";
// import GoogleLoginButton from "../components/GoogleLoginButton";
import { Card } from "@/components/ui/card";
import { json, redirect, useOutletContext } from "@remix-run/react";
import { getSupabaseWithSessionAndHeaders } from "~/services/supabase.server";
import { Button } from "@/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const { headers, serverSession } = await getSupabaseWithSessionAndHeaders({
    request,
  });

  if (serverSession) {
    return redirect('/explore', { headers });
  }

  return json({ success: true });
  // return json({ success: true }, { headers });
  // If 'request' is not used, we can remove it from the destructuring
  return {};
}

export default function Index() {
  // const { supabase, domainUrl } = useOutletContext<SupabaseOutletContext>();
  const { supabase, domainUrl } = useOutletContext<{ supabase: Record<string, any>; domainUrl: string }>();


  const handleSignIn = async () => {
    console.log('clicked login......');
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
      options: {
        redirectTo: `${domainUrl}/auth/callback`,
      },
    });
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
  };

    return (
      <PageContainer>
        <div className="flex min-h-full flex-1 flex-col justify-center pb-8 sm:px-6 lg:px-8 pt-0">
          <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
            <div className="w-16 mb-2">
              <PixelStudioIcon />
            </div>
            {/* <h2 className="text-center text-2xl font-bold leading-9 tracking-tight">
              Pixel Studio AI{" "}
            </h2> */}
            <h2 className="text-2xl m-0">Pixel Studio AI</h2>
  
            <h1 className="mt-6 text-center text-1xl">Sign in to your account</h1>
          </div>
  
          <Card className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="bg-[#24292F] px-6 py-12 shadow sm:rounded-lg sm:px-12">
          
  

  
              <div>
 
  
                <p className="text-center text-sm text-gray-200">Sign in with</p>
                <div className="mt-6 w-full">
                  {/* <GoogleLoginButton /> */}
                  <Button
            onClick={handleSignIn}
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

                </div>
              </div>
            </div>
  
          </Card>
        </div>
  

      </PageContainer>
    );
  }
  