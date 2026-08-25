import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/api-handler";

export const GET = withApiHandler(async (_request, _context, { requestId }) =>
  NextResponse.json({ status: "ok", requestId }),
);
