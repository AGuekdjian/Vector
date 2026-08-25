import { Geist } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: { default: "Vector", template: "%s | Vector" },
  description: "Gestión segura de clientes y órdenes de servicio.",
  applicationName: "Vector",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
