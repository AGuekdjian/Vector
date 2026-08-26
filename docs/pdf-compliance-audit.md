# Auditoría de cumplimiento del documento maestro

Revisión realizada sobre las 56 páginas del documento “Aplicación de Órdenes de Servicio”. Este archivo distingue los requisitos del documento de las decisiones posteriores solicitadas por el propietario.

## Cumplimiento funcional

- Roles OWNER, ADMIN y TECHNICIAN con autorización aplicada en servidor.
- Employee separado de User; username administrativo/técnico generado automáticamente.
- Sesiones seguras, rate limiting y auditoría de accesos.
- Clientes con los campos del documento, borrado lógico, búsqueda y paginación.
- Número de cliente, número de abonado y dirección principal se mantienen como ampliaciones solicitadas posteriormente.
- Cada cliente admite una o varias ubicaciones con nombre, dirección y departamento.
- Al crear un cliente se crea su ubicación “Dirección principal”. En la orden se precarga esa dirección y se puede registrar otra ubicación sin perder la anterior.
- Sistemas ALARM, CCTV, ACCESS_CONTROL y OTHER en una entidad común; IMEI como texto sin límite artificial; retiro/reemplazo conserva historial.
- Órdenes con número Eximia único, ubicación, técnico, compañero, vehículo, fecha, hora, secuencia, notas separadas, relación con orden anterior, estados y timeline.
- Resultados COMPLETED, REQUIRES_QUOTE y NOT_COMPLETED. Cotización separa diagnóstico de detalle a cotizar; “No realizada” usa los motivos administrables indicados en el documento.
- El técnico sólo recibe la proyección autorizada y únicamente accede a sus órdenes.
- Google Maps se genera desde la dirección almacenada.
- PWA, caché IndexedDB, outbox, persistencia offline, sincronización idempotente y conflictos visibles.
- No existen endpoints de borrado físico funcional. No se implementan inventario, tarjetas, fotos, firma ni WhatsApp.
- Auditoría de operaciones y timeline de órdenes; registro operacional de fallas con request ID.
- Dashboard operacional, filtros de órdenes, auditoría filtrable y panel de salud exclusivo para OWNER.
- React Hook Form, Zod en cliente/servidor, TanStack Query, debounce, índices, paginación, route code splitting y skeletons.
- Lint, unitarias, integración, Playwright, accesibilidad, PWA, build, Docker y GitHub Actions.

## Decisiones posteriores que prevalecen

- Las políticas de contraseña y PIN existentes no se modifican en esta revisión por pedido expreso del propietario.
- El despliegue Vercel permanece aplazado hasta que el propietario complete pruebas manuales, según su instrucción posterior.
- MongoDB Atlas permanece externo a Docker Compose y no es eliminado por los scripts locales.

## Verificación continua

La CI debe seguir ejecutando lint, pruebas unitarias, integración, build, imagen Docker y Playwright. Una revisión sólo puede fusionarse a `main` cuando la ejecución de `dev` finaliza correctamente.
