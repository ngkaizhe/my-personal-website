import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NavLink } from "@/components/ui/NavLink";
import { UserMenu } from "@/components/auth/UserMenu";
import { auth } from "@/auth";
import { isAiParseAvailable } from "@/lib/aiAvailable";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const user = session?.user;
  const aiAvailable = isAiParseAvailable();

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
            {aiAvailable && <NavLink href="/dashboard/quick-add">Quick Add</NavLink>}
            <NavLink href="/dashboard/entries">Entries</NavLink>
            <NavLink href="/dashboard/experiences">Experiences</NavLink>
            <NavLink href="/dashboard/resume">Resume</NavLink>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <UserMenu
                user={{
                  name: user.name,
                  email: user.email,
                  image: user.image,
                  username: user.username,
                }}
              />
            )}
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
