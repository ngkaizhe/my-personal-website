import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Timeline from "@/components/Timeline";
import { CopyPublicUrlButton } from "@/components/auth/CopyPublicUrlButton";
import { auth } from "@/auth";
import { isAiParseAvailable } from "@/lib/aiAvailable";
import { getTimelineItems } from "./actions";

export const metadata = {
  title: "Timeline",
};

export default async function Page() {
  const [session, timelineData, t] = await Promise.all([
    auth(),
    getTimelineItems(),
    getTranslations("Timeline"),
  ]);
  // Quick Add is the fastest capture flow, but it needs the AI key; fall
  // back to the manual entry form when the key isn't configured.
  const addHref = isAiParseAvailable() ? "/dashboard/quick-add" : "/dashboard/entries/new";

  return (
    <div className="bg-page min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-end">
        <CopyPublicUrlButton username={session?.user?.username ?? null} />
      </div>
      <Timeline items={timelineData} editable />

      <Link
        href={addHref}
        aria-label={t("addEntryCta")}
        title={t("addEntryCta")}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        <span className="hidden sm:inline">{t("addEntryCta")}</span>
      </Link>
    </div>
  );
}
