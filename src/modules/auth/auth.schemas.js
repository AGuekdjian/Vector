import { z } from "zod";

export const ADMIN_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,128}$/;
export const TECHNICIAN_PIN_PATTERN = /^\d{4}$/;

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
    if (data.role === "ADMIN" && !ADMIN_PASSWORD_PATTERN.test(data.password))
      context.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "La contraseña administrativa no cumple la política de seguridad.",
      });
    if (
      data.role === "TECHNICIAN" &&
      !TECHNICIAN_PIN_PATTERN.test(data.password)
    )
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "El PIN técnico debe tener exactamente 4 dígitos.",
      });
  });
