import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { ServiceOrder } from "@/modules/service-orders/service-order.model";
export const GET = withApiHandler(async () => {
  await requireUser(["OWNER", "ADMIN"]);
  await connectDatabase();
  const now = new Date();
  const uruguay = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const year = uruguay.getUTCFullYear();
  const monthIndex = uruguay.getUTCMonth();
  const day = uruguay.getUTCDate();
  const boundary = (y, m, d) => new Date(Date.UTC(y, m, d, 3));
  const today = boundary(year, monthIndex, day);
  const tomorrow = boundary(year, monthIndex, day + 1);
  const month = boundary(year, monthIndex, 1);
  const nextMonth = boundary(year, monthIndex + 1, 1);
  const previous = boundary(year, monthIndex - 1, 1);
  const [result] = await ServiceOrder.aggregate([
    {
      $match: {
        active: true,
        scheduledDate: { $gte: previous, $lt: nextMonth },
      },
    },
    {
      $facet: {
        today: [
          { $match: { scheduledDate: { $gte: today, $lt: tomorrow } } },
          { $count: "value" },
        ],
        thisMonth: [
          { $match: { scheduledDate: { $gte: month, $lt: nextMonth } } },
          { $count: "value" },
        ],
        previousMonth: [
          { $match: { scheduledDate: { $gte: previous, $lt: month } } },
          { $count: "value" },
        ],
        byStatus: [
          { $match: { scheduledDate: { $gte: month, $lt: nextMonth } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  return NextResponse.json({
    today: result.today[0]?.value || 0,
    thisMonth: result.thisMonth[0]?.value || 0,
    previousMonth: result.previousMonth[0]?.value || 0,
    byStatus: Object.fromEntries(result.byStatus.map((x) => [x._id, x.count])),
  });
});
