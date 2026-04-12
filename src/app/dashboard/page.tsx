import Timeline from "@/components/Timeline";
import { getTimelineItems } from "./actions";

export const metadata = {
  title: "Timeline",
};

export default async function Page() {
  const timelineData = await getTimelineItems();

  return (
    <div className="bg-page min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}

