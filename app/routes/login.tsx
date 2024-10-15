import { PageContainer } from "~/components";
import PixelStudioIcon from "components/PixelStudioIcon";
import type { LoaderFunctionArgs } from "@remix-run/node";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Card } from "@/components/ui/card";
import { json } from "@remix-run/react";
// import { getSupabaseWithSessionAndHeaders } from "~/services/supabase.server";
import { requireAnonymous } from "~/services";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAnonymous(request);

  return json({});
}

export default function Index() {
  return (
    <PageContainer>
      <div className="flex min-h-full flex-1 flex-col justify-center pb-8 sm:px-6 lg:px-8 pt-0">
        <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
          <div className="w-16 mb-2">
            <PixelStudioIcon />
          </div>
          <h2 className="text-2xl m-0">Pixel Studio AI</h2>
          <h1 className="mt-6 text-center text-1xl">Sign in to your account</h1>
        </div>

        <Card className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-[#24292F] px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <div>
              <p className="text-center text-sm text-gray-200">Sign in with</p>
              <div className="mt-6 w-full">
                <GoogleLoginButton />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
