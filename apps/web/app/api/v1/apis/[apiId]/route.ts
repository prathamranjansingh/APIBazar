import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/errors";
import { apiService } from "@/lib/services/api.service";
import { updateApiSchema } from "@/lib/zod/schemas/api.schema";

type RouteContext = { params: { id: string } };

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const api = await apiService.getApiById(params.id);
    return NextResponse.json(api);
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withSession(async ({ req, session, params }) => {
  const body = await req.json();
  const validatedBody = updateApiSchema.parse(body);
  const updatedApi = await apiService.updateApi(params.id!, validatedBody, session.user.id);
  return NextResponse.json(updatedApi);
});

export const DELETE = withSession(async ({ session, params }) => {
  await apiService.deleteApi(params.id!, session.user.id);
  return NextResponse.json({ message: "API deleted successfully" });
});