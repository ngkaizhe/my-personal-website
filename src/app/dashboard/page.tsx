import Timeline from "@/components/Timeline";
import { getTimelineItems } from "./actions";

export default async function Page() {
  const timelineData = await getTimelineItems();

  return (
    <div className="bg-page min-h-screen">
      <Timeline items={timelineData} />
    </div>
  );
}

