"use client";

import type { DisplaySettings } from "@/lib/storage";

const OPTIONS: { key: keyof DisplaySettings; label: string }[] = [
  { key: "showIpa", label: "IPA" },
  { key: "showKorean", label: "한글 발음" },
  { key: "hideMeaning", label: "뜻 가리기" },
  { key: "hideGerman", label: "독일어 가리기" },
];

interface Props {
  settings: DisplaySettings;
  onChange: (next: DisplaySettings) => void;
}

export default function DisplayToggles({ settings, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="표시 설정">
      {OPTIONS.map(({ key, label }) => {
        const on = settings[key];
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange({ ...settings, [key]: !on })}
            className={[
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              on ? "border-swiss bg-swiss text-white" : "border-line text-muted",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
