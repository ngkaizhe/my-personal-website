import { getResumeData } from "./actions";
import ResumeBuilder from "@/components/Resume/ResumeBuilder";

export const metadata = {
    title: "Resume Builder",
};

export default async function ResumePage() {
    const data = await getResumeData();

    return (
        <div className="p-4 md:p-8 bg-page min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Resume Builder</h1>
                    <p className="text-text-muted mt-2">
                        Generate resume bullets from your entries. Filter by employer and date, then copy the markdown or download a .md file.
                    </p>
                </div>

                <ResumeBuilder data={data} />
            </div>
        </div>
    );
}
