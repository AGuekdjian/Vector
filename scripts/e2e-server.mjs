import { spawn } from "node:child_process";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Employee } from "../src/modules/employees/employee.model.js";
import { User } from "../src/modules/users/user.model.js";
import { NotCompletedReason } from "../src/modules/service-orders/not-completed-reason.model.js";

const mongod = await MongoMemoryServer.create({
  binary: { version: process.env.MONGOMS_VERSION || "7.0.14" },
  instance: { launchTimeout: 120_000, storageEngine: "wiredTiger" },
});
const uri = mongod.getUri("vector-e2e");
await mongoose.connect(uri);
const [adminEmployee, technicianEmployee] = await Employee.create([
  { firstName: "Natalia", lastName: "Admin" },
  { firstName: "Anthony", lastName: "Técnico" },
]);
await User.create([
  {
    employeeId: adminEmployee._id,
    username: "nadmin",
    passwordHash: await bcrypt.hash("Admin!123456789", 10),
    role: "ADMIN",
  },
  {
    employeeId: technicianEmployee._id,
    username: "atecnico",
    passwordHash: await bcrypt.hash("Tech!123456789", 10),
    role: "TECHNICIAN",
  },
]);
await NotCompletedReason.create({ label: "Cliente ausente", sortOrder: 1 });
await mongoose.disconnect();
const command = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(command, ["run", "dev"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    MONGODB_URI: uri,
    AUTH_SECRET: "e2e-secret-that-is-at-least-thirty-two-characters",
    NEXT_PUBLIC_APP_NAME: "Vector",
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
  },
});
const shutdown = async () => {
  child.kill();
  await mongod.stop();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
child.on("exit", async (code) => {
  await mongod.stop();
  process.exit(code ?? 0);
});
