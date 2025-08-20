import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { apiService } from "@/lib/services/api.service";

export const GET = withSession(async ({ session }) => {
  const apis = await apiService.getMyApis(session.user.id);
  return NextResponse.json(apis);
});