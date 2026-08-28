import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <main className="public-shell">
      <section className="public-story" aria-hidden="true">
        <div className="public-story-content">
          <div className="public-logo">
            <span className="app-brand-mark">V</span> Vector
          </div>
          <div className="public-copy">
            <p className="eyebrow !text-red-300">Operación conectada</p>
            <h1>Tu servicio técnico, bajo control.</h1>
            <p>
              Clientes, equipos y órdenes coordinados en un solo lugar, desde la
              planificación hasta el cierre en campo.
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Gestión clara. Trabajo trazable.
          </p>
        </div>
      </section>
      <section className="public-form-side">
        <div className="public-card">
          <div className="public-mobile-logo public-logo">
            <span className="app-brand-mark">V</span> Vector
          </div>
          <p className="eyebrow">Acceso seguro</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            Bienvenido
          </h1>
          <p className="mt-2 text-zinc-600">
            Ingresá con tus credenciales para continuar.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
