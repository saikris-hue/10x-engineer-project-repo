import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../shared";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
  sidebarContent?: ReactNode;
  title?: string;
}

export default function Layout({
  children,
  headerActions,
  sidebarContent,
  title,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Header
        actions={headerActions}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
        showSidebarToggle={Boolean(sidebarContent)}
        title={title}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {sidebarContent ? <div className="hidden lg:block">{sidebarContent}</div> : null}
        <main>{children}</main>
      </div>

      {sidebarContent && sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close collections sidebar"
            className="absolute inset-0 bg-ink/55"
            type="button"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(88vw,22rem)] overflow-y-auto bg-mist p-4 shadow-float">
            <div className="mb-4 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)}>
                Close
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
