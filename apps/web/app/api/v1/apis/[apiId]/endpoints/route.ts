import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { apiService } from "@/lib/services/api.service";
import { endpointSchema } from "@/lib/zod/schemas/endpoint.schema";

type RouteContext = { params: { apiId: string } };


export const POST = withSession(async ({ req, session, params }) => {
  const body = await req.json();
  const validatedBody = endpointSchema.parse(body);
  const endpoint = await apiService.addEndpoint(params.apiId!, validatedBody, session.user.id);
  return NextResponse.json(endpoint, { status: 201 });
});