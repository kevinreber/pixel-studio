import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { PageContainer } from "~/components";
import { redis } from "~/services/redis.server";

export async function loader() {
  // Example: Set a value
  await redis.set("test-key", "Hello from Upstash Redis!");

  // Get the value back
  const value = await redis.get("test-key");

  return json({ value: value as string });
}

export default function TestRedis() {
  const { value } = useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <div className="p-4">
        <h1 className="text-xl font-bold">Redis Test</h1>
        <p>Value from Redis: {value}</p>
      </div>
    </PageContainer>
  );
}
