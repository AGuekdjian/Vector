import Link from "next/link";

export default function Home() {
  return (
    <main className="public-shell">
      <section className="public-story">
        <div className="public-story-content">
          <div className="public-logo">
            <span className="app-brand-mark">V</span> Vector
          </div>
          <div className="public-copy">
            <p className="eyebrow !text-red-300">Gestión de servicios</p>
            <h1>Más claridad para cada visita técnica.</h1>
            <p>
              Planificá, asigná y seguí el trabajo de tu equipo con toda la
              información importante siempre disponible.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Diseñado para operar. Preparado para crecer.
          </p>
        </div>
      </section>
      <section className="public-form-side">
        <div className="public-card">
          <div className="public-mobile-logo public-logo">
            <span className="app-brand-mark">V</span> Vector
          </div>
          <p className="eyebrow">Plataforma operativa</p>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
            Órdenes de servicio
          </h2>
          <p className="mt-3 leading-7 text-zinc-600">
            Administración y técnicos trabajando con una única fuente de
            información.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-red-800 px-5 font-semibold text-white shadow-lg shadow-red-900/15 hover:bg-red-900"
            href="/login"
          >
            Ingresar{" "}
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
