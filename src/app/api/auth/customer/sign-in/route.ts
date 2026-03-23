import { handleSignInRequest } from "@/lib/auth/sign-in-route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleSignInRequest(request, { defaultPortal: "shop" });
}
