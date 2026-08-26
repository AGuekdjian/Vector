import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/http/api-handler";
import { requireUser } from "@/lib/permissions/authorize";
import { Employee } from "@/modules/employees/employee.model";

export const GET = withApiHandler(async () => {
  const user = await requireUser();
  const employee = await Employee.findById(user.employeeId)
    .select("firstName lastName")
    .lean();
  return NextResponse.json({
    user: {
      ...user,
      name: employee
        ? `${employee.firstName} ${employee.lastName}`
        : user.username,
    },
  });
});
