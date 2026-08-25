import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";

export const GET = withApiHandler(async () =>
  NextResponse.json({ user: await requireUser() }),
);
