import type { Audio } from "@/types/lesson";
import { VOICES } from "@/lib/voices";
import AudioButton from "./AudioButton";

/** 목소리별 [일반 · 느리게] 버튼 묶음 */
export default function AudioRow({ audio, kind }: { audio: Audio; kind: "단어" | "문장" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {VOICES.map(({ id, label }) => (
        <div key={id} className="flex items-center gap-1 rounded-full bg-black/4 py-0.5 pr-0.5 pl-3 dark:bg-white/5">
          <span className="text-muted mr-1 text-xs font-medium">{label}</span>
          <AudioButton src={audio[id].normal} label={`${kind} 듣기 (${label})`} />
          {audio[id].slow && (
            <AudioButton src={audio[id].slow} label={`느리게 듣기 (${label})`} variant="slow" />
          )}
        </div>
      ))}
    </div>
  );
}
