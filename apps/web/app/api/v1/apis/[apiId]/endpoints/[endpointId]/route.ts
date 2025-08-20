import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth/session";
import { apiService } from "@/lib/services/api.service";
import { updateEndpointSchema } from "@/lib/zod/schemas/endpoint.schema";

type RouteContext = { params: { apiId: string; endpointId: string } };


export const PATCH = withSession(async ({ req, session, params }) => {
  const body = await req.json();
  const validatedBody = updateEndpointSchema.parse(body);
  const updatedEndpoint = await apiService.updateEndpoint(params.apiId!, params.endpointId!, validatedBody, session.user.id);
  return NextResponse.json(updatedEndpoint);
});


export const DELETE = withSession(async ({ session, params }) => {
  await apiService.deleteEndpoint(params.apiId!, params.endpointId!, session.user.id);
  return NextResponse.json({ message: "Endpoint deleted successfully" });
});