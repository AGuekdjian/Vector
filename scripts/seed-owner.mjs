import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Employee } from "../src/modules/employees/employee.model.js";
import { User } from "../src/modules/users/user.model.js";
import { NotCompletedReason } from "../src/modules/service-orders/not-completed-reason.model.js";
const [, , firstName, lastName, username, password] = process.argv;
if (!firstName || !lastName || !username || !password || password.length < 4)
  throw new Error(
    "Uso: npm run seed:owner -- Nombre Apellido usuario contraseña-segura",
  );
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI es obligatoria");
await mongoose.connect(process.env.MONGODB_URI);
const normalizedUsername = username.toLowerCase();
const existingOwner = await User.findOne({ role: "OWNER" }).select(
  "+passwordHash +sessionVersion",
);
if (existingOwner && existingOwner.username !== normalizedUsername)
  throw new Error(
    `Ya existe un OWNER con el usuario ${existingOwner.username}. No se realizaron cambios.`,
  );

let employee;
if (existingOwner) {
  employee = await Employee.findById(existingOwner.employeeId);
  employee.firstName = firstName;
  employee.lastName = lastName;
  await employee.save();
  existingOwner.passwordHash = await bcrypt.hash(password, 12);
  existingOwner.active = true;
  existingOwner.sessionVersion += 1;
  existingOwner.failedLoginAttempts = 0;
  existingOwner.lockedUntil = null;
  await existingOwner.save();
} else {
  employee = await Employee.create({ firstName, lastName });
  await User.create({
    employeeId: employee._id,
    username: normalizedUsername,
    passwordHash: await bcrypt.hash(password, 12),
    role: "OWNER",
  });
}
const reasons = [
  "Cliente ausente",
  "Cliente no puede recibir al técnico",
  "Cliente solicita recoordinar",
  "No fue posible contactar al cliente",
  "No se pudo acceder al lugar",
  "Dirección incorrecta",
  "Condiciones del lugar impiden realizar el trabajo",
  "Orden asignada incorrectamente",
  "Otro motivo administrativo",
];
for (const [sortOrder, label] of reasons.entries())
  await NotCompletedReason.updateOne(
    { label },
    { $setOnInsert: { label, sortOrder } },
    { upsert: true },
  );
await mongoose.disconnect();
console.log("OWNER y motivos iniciales configurados correctamente.");
