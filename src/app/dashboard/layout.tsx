import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NavLink } from "@/components/ui/NavLink";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface focus:text-text-primary focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-header-border">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3" aria-label="Primary navigation">
          <div className="flex items-center gap-1 overflow-x-auto">
            <NavLink href="/dashboard" exact>Timeline</NavLink>
            <NavLink href="/dashboard/quick-add">Quick Add</NavLink>
            <NavLink href="/dashboard/entries">Entries</NavLink>
            <NavLink href="/dashboard/employers">Employers</NavLink>
            <NavLink href="/dashboard/resume">Resume</NavLink>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main id="main-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
