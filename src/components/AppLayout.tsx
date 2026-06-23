import { Link, Outlet } from "@tanstack/react-router";
import { Library, Hammer, Boxes } from "lucide-react";
import { Toaster } from "sonner";

const NAV = [
  { to: "/", label: "Library", icon: Library, exact: true },
  { to: "/builder", label: "Builder", icon: Hammer, exact: false },
  { to: "/chunks", label: "Chunks", icon: Boxes, exact: false },
] as const;

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface/40">
        <div className="px-6 py-7">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-foreground text-background grid place-items-center text-xs font-semibold">
              P
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Promptkit</span>
          </Link>
        </div>
        <nav className="px-3 py-2 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
            >
              <item.icon className="h-4 w-4" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-6 py-5 text-[11px] text-muted-foreground/70">
          개인용 프롬프트 도구
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 h-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-semibold">P</div>
          <span className="text-sm font-semibold">Promptkit</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="rounded-md px-2.5 py-1 text-xs text-muted-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="flex-1 min-w-0 md:pt-0 pt-12">
        <Outlet />
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
