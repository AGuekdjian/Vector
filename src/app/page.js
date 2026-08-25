import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
        <span className="inline-flex rounded-md bg-red-800 px-2.5 py-1 text-sm font-bold tracking-wide text-white">
          VECTOR
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
          Órdenes de servicio
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          Gestión operativa segura para administración y técnicos.
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-red-800 px-5 font-semibold text-white transition hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800"
          href="/login"
        >
          Ingresar
        </Link>
      </section>
    </main>
  );
}
