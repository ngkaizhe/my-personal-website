import Timeline from "@/components/Timeline";
import { CopyPublicUrlButton } from "@/components/auth/CopyPublicUrlButton";
import { auth } from "@/auth";
import { getTimelineItems } from "./actions";

export const metadata = {
  title: "Timeline",
};

export default async function Page() {
  const [session, timelineData] = await Promise.all([
    auth(),
    getTimelineItems(),
  ]);

  return (
    <div className="bg-page min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-6 flex justify-end">
        <CopyPublicUrlButton username={session?.user?.username ?? null} />
      </div>
      <Timeline items={timelineData} editable />
    </div>
  );
}
