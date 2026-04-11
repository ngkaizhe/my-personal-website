import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-header-border">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-header-text hover:text-header-text-hover px-4 py-2 rounded-lg hover:bg-black/5 transition-all duration-200"
            >
              Timeline
            </Link>
            <Link
              href="/dashboard/journeys"
              className="text-sm font-medium text-header-text hover:text-header-text-hover px-4 py-2 rounded-lg hover:bg-black/5 transition-all duration-200"
            >
              Journeys
            </Link>
          </div>
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
};

export default DashboardLayout;
