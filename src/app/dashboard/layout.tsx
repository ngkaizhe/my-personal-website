import Link from "next/link";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              Timeline
            </Link>
            <Link
              href="/dashboard/journeys"
              className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              Journeys
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
};

export default DashboardLayout;
