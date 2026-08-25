export default function manifest() {
  return {
    name: "Vector — Órdenes de servicio",
    short_name: "Vector",
    description: "Gestión de órdenes de servicio",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#991b1b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
