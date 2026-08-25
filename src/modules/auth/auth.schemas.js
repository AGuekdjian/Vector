import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(2).max(80),
  password: z.string().min(4).max(128),
});
export const createUserSchema = z
  .object({
    employeeId: z.string().regex(/^[a-f\d]{24}$/i),
    role: z.enum(["ADMIN", "TECHNICIAN"]),
    password: z.string().min(4).max(128),
  })
  .superRefine((data, context) => {
    if (
      data.role === "ADMIN" &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/.test(
        data.password,
      )
    )
      context.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "La contraseña administrativa no cumple la política de seguridad.",
      });
  });
