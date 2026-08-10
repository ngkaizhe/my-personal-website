import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { NavLink } from "@/components/ui/NavLink";
import { UserMenu } from "@/components/auth/UserMenu";
import { auth } from "@/auth";
import { isAiParseAvailable } from "@/lib/aiAvailable";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const user = session?.user;

  // Sign-in wall for the whole /dashboard group. The proxy holds no session
  // logic anymore; this layout is the UX gate, and the real security boundary
  // stays in the data layer (every server action calls getCurrentUserId(),
  // which throws without a session). x-pathname is stamped by the proxy so
  // the landing page can bounce the user back here after sign-in.
  // Deliberately no username check — the JWT can carry username=null for the
  // cookie's lifetime under the Credentials provider (useSession().update()
  // doesn't stick), so redirecting on it would loop; UserMenu surfaces
  // "Set up your profile" instead.
  if (!user) {
    const h = await headers();
    const backTo = h.get("x-pathname") ?? "/dashboard";
    redirect(`/?callbackUrl=${encodeURIComponent(backTo)}`);
  }

  const aiAvailable = isAiParseAvailable();
  const tNav = await getTranslations('Nav');

  return (
    <div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-surface focus:text-text-primary focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {tNav('skipToMain')}
      </a>
      <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-header-border">
        <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3" aria-label={tNav('primaryNav')}>
          <div className="flex items-center gap-1 overflow-x-auto min-w-0 scrollbar-none">
            <NavLink href="/dashboard" exact>{tNav('timeline')}</NavLink>
            {aiAvailable && <NavLink href="/dashboard/quick-add">{tNav('quickAdd')}</NavLink>}
            <NavLink href="/dashboard/entries">{tNav('entries')}</NavLink>
            <NavLink href="/dashboard/experiences">{tNav('experiences')}</NavLink>
            <NavLink href="/dashboard/skills">{tNav('skills')}</NavLink>
            <NavLink href="/dashboard/resume">{tNav('resume')}</NavLink>
            <NavLink href="/dashboard/domain">{tNav('domain')}</NavLink>
          </div>
          <div className="flex items-center gap-2 shrink-0 pl-2">
            <LocaleToggle />
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
