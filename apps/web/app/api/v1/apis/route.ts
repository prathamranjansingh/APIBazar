import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { apiService } from "@/lib/services/api.service";
import { apiSchema, listApisSchema } from "@/lib/zod/schemas/api.schema";
import { handleApiError } from "@/lib/api/errors"; 


export async function GET(req: Request) {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams.entries());
    const validatedParams = listApisSchema.parse(params);
    const result = await apiService.getApis(validatedParams);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}


export const POST = withSession(async ({ req, session }) => {
  const body = await req.json();
  const validatedBody = apiSchema.parse(body);
  const newApi = await apiService.createApi(validatedBody, session.user.id);
  return NextResponse.json(newApi, { status: 201 });
});