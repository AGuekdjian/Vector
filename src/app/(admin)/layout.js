import { QueryProvider } from "@/components/providers/query-provider";

export default function AdminLayout({ children }) {
  return <QueryProvider>{children}</QueryProvider>;
}
