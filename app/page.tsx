import HomeView from "@/components/HomeView";
import { getLessonSummaries } from "@/lib/lessons";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-bold tracking-[0.2em] text-swiss">🇨🇭 SWISS TRIP DEUTSCH</p>
        <h1 className="text-2xl font-bold">스위스 여행을 위한 독일어</h1>
        <p className="text-muted text-sm">매일 17:00 새 레슨 · 단어 10 · 문장 3 · 문법 1</p>
      </header>
      <HomeView lessons={getLessonSummaries()} />
    </div>
  );
}
