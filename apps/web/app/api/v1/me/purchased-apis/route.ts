import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { apiService } from "@/lib/services/api.service";

// GET /api/v1/me/purchased-apis
export const GET = withSession(async ({ session }) => {
  const apis = await apiService.getPurchasedApis(session.user.id);
  return NextResponse.json(apis);
});