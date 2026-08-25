# Vector — Órdenes de servicio

Aplicación web mobile-first para administrar clientes, instalaciones, sistemas técnicos y órdenes de servicio. Incluye una PWA offline para técnicos, historial inmutable y controles de acceso en servidor.

## Funcionalidad

- Roles `OWNER`, `ADMIN` y `TECHNICIAN`. Solo `OWNER` administra otros administradores y ningún administrador puede modificar al propietario.
- OWNER y ADMIN usan contraseñas de al menos 10 caracteres con mayúscula, minúscula, número y símbolo; los técnicos usan un PIN de exactamente 4 dígitos.
- Clientes, contratos, instalaciones y sistemas instalados con retiro y reemplazo sin borrar historial.
- Órdenes con número externo único, técnico, acompañante, vehículo, resultado y línea de tiempo.
- El técnico solo accede a sus órdenes asignadas. Puede abrir Maps, iniciar/finalizar trabajos y actualizar sistemas.
- Caché local, outbox idempotente, reintentos y conflictos visibles. No se guardan contraseñas ni sesiones en IndexedDB.
- Auditoría, borrado lógico y logs estructurados que redactan datos sensibles.

Quedan fuera deliberadamente inventario, tarjetas, fotos, firmas y WhatsApp.

## Instalación

Requiere Node.js 22 y MongoDB 7 o superior (MongoDB Atlas recomendado).

1. Ejecute `npm ci`.
2. Copie `.env.example` a `.env.local`.
3. Defina `MONGODB_URI`, una `AUTH_SECRET` aleatoria de al menos 32 caracteres, `NEXT_PUBLIC_APP_NAME` y `NEXT_PUBLIC_BASE_URL`.
4. Cree el primer propietario con `npm run seed:owner -- Nombre Apellido usuario "Contraseña!Segura123"`.
5. Ejecute `npm run dev` y abra `http://localhost:3000`.

No versione secretos ni `.env.local`. En Atlas use privilegios mínimos y restrinja el acceso de red.

## Trabajo offline

El técnico debe iniciar sesión y abrir sus órdenes una vez con conexión. Las operaciones se guardan primero en la outbox y se sincronizan al recuperar conectividad. La pantalla **Sincronización** muestra pendientes, errores y conflictos. Antes de cerrar sesión hay que sincronizar o resolver operaciones locales, porque la caché se separa y limpia por identidad.

## Comandos

- `npm run lint`: análisis estático.
- `npm run test`: pruebas unitarias.
- `npm run test:integration`: pruebas de integración.
- `npm run test:e2e`: flujo Playwright con MongoDB efímero.
- `npm run build`: compilación de producción.
- `npm run start`: servidor de producción compilado.

La primera prueba E2E descarga MongoDB. Puede elegir otra versión compatible con `MONGOMS_VERSION`.

## Docker en Windows

Docker Compose ejecuta la aplicación en modo producción y se conecta al `MONGODB_URI` de `.env.local`. MongoDB Atlas es externo al Compose y nunca es eliminado por los scripts.

- Iniciar y esperar el healthcheck: `scripts\docker-start.cmd` o `npm run docker:up`.
- Detener y eliminar contenedor, red, volúmenes efímeros e imagen de Vector: `scripts\docker-stop.cmd` o `npm run docker:down`.

Docker Desktop debe estar iniciado. El script de limpieza usa el nombre de proyecto `vector`, por lo que no elimina recursos de otros proyectos ni modifica MongoDB Atlas.

## Arquitectura

- `src/app`: App Router, páginas y endpoints HTTP.
- `src/modules`: modelos, validaciones y servicios de dominio.
- `src/components`: interfaz administrativa y técnica.
- `src/lib`: sesión, permisos, base de datos, errores y logging.
- `src/offline`: IndexedDB, outbox y sincronización.
- `tests`: pruebas unitarias, integración y E2E.

La autorización y el aislamiento del técnico siempre se aplican en backend. Las operaciones offline llevan identificador y hash para que un reintento no duplique cambios.

## Integración continua

En producción, la sesión usa cookies `HttpOnly`, `Secure` y `SameSite=Lax`. También se envían CSP, protección anti-iframe, MIME sniffing, política de referencia y permisos restringidos.

El workflow `CI` valida cada push y pull request con lint, pruebas unitarias, integración, compilación, imagen Docker y pruebas E2E. El despliegue queda deliberadamente fuera del repositorio hasta completar las pruebas manuales de aceptación.

## Problemas frecuentes

- Conexión: revise `MONGODB_URI`, acceso de Atlas y DNS.
- Sesión: confirme `AUTH_SECRET` y que sea igual en todas las instancias.
- PWA desactualizada: cierre pestañas, vuelva a cargar con conexión y revise el service worker.
- Cambios pendientes: abra **Sincronización**, recupere conectividad y reintente; los conflictos requieren revisar la versión del servidor.
