import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Employee } from "../src/modules/employees/employee.model.js";
import { User } from "../src/modules/users/user.model.js";
import { NotCompletedReason } from "../src/modules/service-orders/not-completed-reason.model.js";
const [, , firstName, lastName, username, password] = process.argv;
if (!firstName || !lastName || !username || !password || password.length < 12)
  throw new Error(
    "Uso: npm run seed:owner -- Nombre Apellido usuario contraseña-segura",
  );
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI es obligatoria");
await mongoose.connect(process.env.MONGODB_URI);
if (await User.exists({ role: "OWNER" })) throw new Error("Ya existe un OWNER");
const employee = await Employee.create({ firstName, lastName });
await User.create({
  employeeId: employee._id,
  username: username.toLowerCase(),
  passwordHash: await bcrypt.hash(password, 12),
  role: "OWNER",
});
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
await NotCompletedReason.insertMany(
  reasons.map((label, sortOrder) => ({ label, sortOrder })),
);
await mongoose.disconnect();
console.log("OWNER y motivos iniciales creados correctamente.");
