# Revisión de performance

Revisión de código y comportamiento realizada después del rediseño. No reemplaza mediciones de producción con tráfico real.

## Mejoras aplicadas

- TanStack Query mantiene caché, evita refetch por foco, limita reintentos y conserva datos anteriores durante cambios de filtros/página.
- La búsqueda de clientes usa debounce y resultados limitados; las ubicaciones se reutilizan desde caché y una selección ya no dispara requests duplicados.
- Listados y consultas MongoDB usan paginación, `lean()`, proyecciones e índices sobre los filtros operativos principales.
- Estadísticas se resuelven con un único aggregate con facets.
- Los módulos administrativos y técnicos permanecen separados por rutas para conservar code splitting automático de Next.js.
- Se incorporaron skeletons estables para dashboard, clientes, órdenes, administración, auditoría y panel OWNER, reduciendo saltos visuales.
- La agenda técnica usa la fecha de Uruguay y conserva snapshot/offline en IndexedDB.
- El panel de salud actualiza cada 30 segundos y no genera tráfico para ADMIN ni TECHNICIAN.
- Los eventos operacionales sólo agregan una escritura cuando una solicitud falla; el camino exitoso no añade consultas.

## Controles existentes

- Pool MongoDB limitado a 10 conexiones por instancia.
- Payload HTTP máximo de 1 MB.
- Paginación en dominios de crecimiento continuo.
- Resultados de búsqueda limitados.
- Service worker, shell offline y persistencia selectiva; no se descarga información administrativa al técnico.

## Próximas mediciones recomendadas

- Medir p50/p95 de endpoints y Core Web Vitals con uso real antes de agregar infraestructura.
- Revisar índices mediante `explain()` cuando el volumen real permita detectar scans costosos.
- Considerar virtualización sólo si un listado visible supera varios cientos de filas; actualmente la paginación la hace innecesaria.
- Ajustar `staleTime` por frecuencia real de cambios después de observar el uso de administración.
