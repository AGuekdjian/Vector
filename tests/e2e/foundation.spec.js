import { expect, test } from "@playwright/test";

const loginApi = (request, username, password) =>
  request.post("/api/auth/login", { data: { username, password } });

test("authenticates every role and rejects invalid credentials", async ({
  request,
}) => {
  for (const credentials of [
    ["oowner", "Owner!123456789", "OWNER"],
    ["nadmin", "Admin!123456789", "ADMIN"],
    ["atecnico", "Tech!123456789", "TECHNICIAN"],
  ]) {
    const response = await loginApi(request, credentials[0], credentials[1]);
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).user.role).toBe(credentials[2]);
    await request.post("/api/auth/logout");
  }
  expect((await loginApi(request, "nadmin", "incorrecta")).status()).toBe(401);
});

test("enforces owner protection and technician isolation", async ({
  request,
}) => {
  await loginApi(request, "nadmin", "Admin!123456789");
  const users = (await (await request.get("/api/users?limit=100")).json())
    .items;
  const owner = users.find((user) => user.role === "OWNER");
  expect(
    (
      await request.patch(`/api/users/${owner._id}/active`, {
        data: { active: false },
      })
    ).status(),
  ).toBe(403);
  const customer = (
    await (
      await request.post("/api/customers", {
        data: {
          customerType: "COMPANY",
          companyName: "Aislado SA",
          primaryPhone: "29000000",
          subscriber: false,
          internalNotes: "Privado",
        },
      })
    ).json()
  ).item;
  const installation = (
    await (
      await request.post("/api/installations", {
        data: {
          customerId: customer._id,
          name: "Central",
          address: "18 de Julio 100",
        },
      })
    ).json()
  ).item;
  const technician = users.find((user) => user.username === "atecnico");
  const order = (
    await (
      await request.post("/api/orders", {
        data: {
          externalOrderNumber: `ISO-${Date.now()}`,
          customerId: customer._id,
          installationId: installation._id,
          responsibleTechnicianId: technician._id,
          scheduledDate: new Date().toISOString(),
          scheduledTime: "10:00",
          workDescription: "Prueba de aislamiento",
          internalNote: "Nunca visible",
        },
      })
    ).json()
  ).item;
  await request.post("/api/auth/logout");
  await loginApi(request, "btecnica", "Tech!987654321");
  expect((await request.get(`/api/orders/${order._id}`)).status()).toBe(404);
  expect((await request.get("/api/customers")).status()).toBe(403);
  expect(
    (
      await request.patch(`/api/customers/${customer._id}`, {
        data: { subscriber: true },
      })
    ).status(),
  ).toBe(403);
  await request.post("/api/auth/logout");
  await loginApi(request, "atecnico", "Tech!123456789");
  const ownOrder = (
    await (await request.get(`/api/orders/${order._id}`)).json()
  ).item;
  expect(ownOrder.internalNote).toBeUndefined();
  expect(ownOrder.customerId.internalNotes).toBeUndefined();
});

test("owner creates an administrator and the administrator creates a technician", async ({
  request,
}) => {
  await loginApi(request, "oowner", "Owner!123456789");
  const adminEmployeeResponse = await request.post("/api/employees", {
    data: { firstName: "Flujo", lastName: "Administrador" },
  });
  expect(adminEmployeeResponse.status()).toBe(201);
  const adminEmployee = (await adminEmployeeResponse.json()).item;
  const adminResponse = await request.post("/api/users", {
    data: {
      employeeId: adminEmployee._id,
      password: "FlowAdmin!123456",
      role: "ADMIN",
    },
  });
  expect(adminResponse.status()).toBe(201);
  const admin = (await adminResponse.json()).item;

  await loginApi(request, admin.username, "FlowAdmin!123456");
  const technicianEmployeeResponse = await request.post("/api/employees", {
    data: { firstName: "Flujo", lastName: "Tecnico" },
  });
  expect(technicianEmployeeResponse.status()).toBe(201);
  const technicianEmployee = (await technicianEmployeeResponse.json()).item;
  const technicianResponse = await request.post("/api/users", {
    data: {
      employeeId: technicianEmployee._id,
      password: "FlowTech!1234567",
      role: "TECHNICIAN",
    },
  });
  expect(technicianResponse.status()).toBe(201);
  expect((await technicianResponse.json()).item.role).toBe("TECHNICIAN");

  const forbiddenAdminResponse = await request.post("/api/users", {
    data: {
      employeeId: technicianEmployee._id,
      password: "AnotherAdmin!123",
      role: "ADMIN",
    },
  });
  expect(forbiddenAdminResponse.status()).toBe(403);
});

test("renders the application entry point", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Órdenes de servicio" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
});

test("admin creates an order and its technician completes it with traceability", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("nadmin");
  await page.getByLabel("Contraseña o PIN").fill("Admin!123456789");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/dashboard/);
  const customerResponse = await page.request.post("/api/customers", {
    data: {
      customerType: "PERSON",
      firstName: "Juan",
      lastName: "Pérez",
      primaryPhone: "099123456",
      subscriber: true,
    },
  });
  expect(customerResponse.ok()).toBeTruthy();
  const customer = (await customerResponse.json()).item;
  const installationResponse = await page.request.post("/api/installations", {
    data: {
      customerId: customer._id,
      name: "Casa",
      address: "Av. Italia 1234, Montevideo",
    },
  });
  const installation = (await installationResponse.json()).item;
  const systemResponse = await page.request.post("/api/systems", {
    data: {
      installationId: installation._id,
      type: "ALARM",
      brand: "DSC",
      model: "585",
      imei: "001234567890123",
    },
  });
  const system = (await systemResponse.json()).item;
  const users = (await (await page.request.get("/api/users")).json()).items;
  const technician = users.find((user) => user.username === "atecnico");
  const orderResponse = await page.request.post("/api/orders", {
    data: {
      externalOrderNumber: "EXIMIA-1001",
      customerId: customer._id,
      installationId: installation._id,
      responsibleTechnicianId: technician._id,
      scheduledDate: new Date().toISOString(),
      scheduledTime: "09:00",
      workDescription: "Mantenimiento alarma",
      technicianNote: "Verificar comunicación",
    },
  });
  expect(orderResponse.ok()).toBeTruthy();
  const order = (await orderResponse.json()).item;
  await page.request.post("/api/auth/logout");
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("atecnico");
  await page.getByLabel("Contraseña o PIN").fill("Tech!123456789");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/technician\/orders/);
  await page.getByText("Juan Pérez").click();
  await expect(
    page.getByRole("link", { name: "Abrir en Maps" }),
  ).toHaveAttribute("href", /google\.com\/maps/);
  await page.getByRole("button", { name: "INICIAR" }).click();
  await expect(page.getByText("Sincronizado")).toBeVisible();
  await page.getByText(/ALARM: DSC 585/).click();
  const brand = page.getByLabel("brand", { exact: true });
  await brand.fill("Hikvision");
  await page.getByRole("button", { name: "Guardar datos técnicos" }).click();
  await expect(page.getByText("Sincronizado")).toBeVisible();
  await page.getByRole("button", { name: "Realizada", exact: true }).click();
  await page
    .getByLabel("Observación")
    .fill("Se realizaron pruebas. Sistema operativo.");
  await page.getByRole("button", { name: "Confirmar resultado" }).click();
  await page.request.post("/api/auth/login", {
    data: { username: "nadmin", password: "Admin!123456789" },
  });
  const finalOrder = (
    await (await page.request.get(`/api/orders/${order._id}`)).json()
  ).item;
  expect(finalOrder.status).toBe("COMPLETED");
  expect(finalOrder.timeline.map((entry) => entry.action)).toEqual(
    expect.arrayContaining([
      "ORDER_CREATED",
      "ORDER_ASSIGNED",
      "ORDER_STARTED",
      "SYSTEM_UPDATED",
      "ORDER_COMPLETED",
    ]),
  );
  const updatedSystem = finalOrder.systems.find(
    (item) => item._id === system._id,
  );
  expect(updatedSystem.brand).toBe("Hikvision");
});

test("handles duplicate numbers, quote and not-completed outcomes", async ({
  request,
}) => {
  await loginApi(request, "nadmin", "Admin!123456789");
  const users = (
    await (await request.get("/api/users?active=true&limit=100")).json()
  ).items;
  const technician = users.find((user) => user.username === "atecnico");
  const customer = (
    await (
      await request.post("/api/customers", {
        data: {
          customerType: "PERSON",
          firstName: "Marta",
          lastName: "Resultado",
          primaryPhone: "098000000",
          subscriber: true,
        },
      })
    ).json()
  ).item;
  const installation = (
    await (
      await request.post("/api/installations", {
        data: {
          customerId: customer._id,
          name: "Casa",
          address: "Colonia 2000",
        },
      })
    ).json()
  ).item;
  const createOrder = (externalOrderNumber) =>
    request.post("/api/orders", {
      data: {
        externalOrderNumber,
        customerId: customer._id,
        installationId: installation._id,
        responsibleTechnicianId: technician._id,
        scheduledDate: new Date().toISOString(),
        scheduledTime: "12:00",
        workDescription: "Diagnóstico",
      },
    });
  const quoteNumber = `QUOTE-${Date.now()}`;
  const quote = (await (await createOrder(quoteNumber)).json()).item;
  expect((await createOrder(quoteNumber)).status()).toBe(409);
  const notCompleted = (await (await createOrder(`NC-${Date.now()}`)).json())
    .item;
  const idempotent = (await (await createOrder(`IDEM-${Date.now()}`)).json())
    .item;
  await request.post("/api/auth/logout");
  await loginApi(request, "atecnico", "Tech!123456789");
  expect(
    (
      await request.post(`/api/orders/${quote._id}/complete`, {
        data: { result: "COMPLETED", observation: "Inválido" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (await request.post(`/api/orders/${quote._id}/start`)).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post(`/api/orders/${quote._id}/complete`, {
        data: {
          result: "REQUIRES_QUOTE",
          observation: "Placa dañada",
          quoteDetails: "Cotizar placa y programación",
        },
      })
    ).ok(),
  ).toBeTruthy();
  const reasons = (
    await (await request.get("/api/not-completed-reasons")).json()
  ).items;
  expect(
    (await request.post(`/api/orders/${notCompleted._id}/start`)).ok(),
  ).toBeTruthy();
  expect(
    (
      await request.post(`/api/orders/${notCompleted._id}/complete`, {
        data: {
          result: "NOT_COMPLETED",
          observation: "Sin acceso",
          notCompletedReasonId: reasons[0]._id,
        },
      })
    ).ok(),
  ).toBeTruthy();
  const operation = {
    operationId: crypto.randomUUID(),
    kind: "START_ORDER",
    entityId: idempotent._id,
    payload: {},
  };
  expect(
    (await request.post("/api/sync", { data: operation })).ok(),
  ).toBeTruthy();
  const duplicate = await request.post("/api/sync", { data: operation });
  expect(duplicate.ok()).toBeTruthy();
  expect((await duplicate.json()).duplicate).toBe(true);
  const syncedOrder = (
    await (await request.get(`/api/orders/${idempotent._id}`)).json()
  ).item;
  expect(
    syncedOrder.timeline.filter(
      (entry) => entry.operationId === operation.operationId,
    ),
  ).toHaveLength(1);
});
