import type { Sentence } from "@/types/lesson";
import type { DisplaySettings } from "@/lib/storage";
import AudioRow from "./AudioRow";
import Maskable from "./Maskable";
import Pronunciation from "./Pronunciation";
import SwissTip from "./SwissTip";

export default function SentenceCard({ sentence, settings }: { sentence: Sentence; settings: DisplaySettings }) {
  return (
    <article className="card space-y-3 p-5">
      <p className="text-xl font-semibold leading-snug">
        <Maskable masked={settings.hideGerman}>{sentence.german}</Maskable>
      </p>
      <AudioRow audio={sentence.audio} kind="문장" />
      <Pronunciation
        data={sentence.pronunciation}
        showIpa={settings.showIpa}
        showKorean={settings.showKorean}
        spaced
      />
      <p className="text-muted">
        <Maskable masked={settings.hideMeaning}>{sentence.meaning}</Maskable>
      </p>
      {sentence.swissNote && <SwissTip>{sentence.swissNote}</SwissTip>}
    </article>
  );
}
