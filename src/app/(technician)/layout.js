import { QueryProvider } from "@/components/providers/query-provider";

export default function TechnicianLayout({ children }) {
  return <QueryProvider>{children}</QueryProvider>;
}
