import type { Gender, Word } from "@/types/lesson";
import type { DisplaySettings } from "@/lib/storage";
import { forvoUrl } from "@/lib/format";
import AudioRow from "./AudioRow";
import Maskable from "./Maskable";
import Pronunciation from "./Pronunciation";
import SwissTip from "./SwissTip";

const GENDER_CLASS: Record<Gender, string> = {
  der: "text-der",
  die: "text-die",
  das: "text-das",
};

const POS_LABEL: Record<Word["partOfSpeech"], string> = {
  noun: "명사",
  verb: "동사",
  adjective: "형용사",
  adverb: "부사",
  preposition: "전치사",
  pronoun: "대명사",
  interjection: "감탄사",
  phrase: "표현",
};

/** "die Bordkarte" → 관사만 성별 색으로 */
function Headword({ word }: { word: Word }) {
  if (word.partOfSpeech !== "noun") return <>{word.german}</>;
  const [article, ...rest] = word.german.split(" ");
  return (
    <>
      <span className={`${GENDER_CLASS[word.gender]} font-semibold`}>{article}</span> {rest.join(" ")}
    </>
  );
}

export default function WordCard({ word, settings }: { word: Word; settings: DisplaySettings }) {
  return (
    <article className="card flex h-full flex-col gap-4 p-5">
      <div>
        <div className="min-w-0">
          <div className="text-muted mb-1 flex items-center gap-2 text-xs">
            <span>{POS_LABEL[word.partOfSpeech]}</span>
            {word.isSwissExpression && (
              <span className="rounded-full bg-swiss px-2 py-0.5 font-semibold text-white">🇨🇭 스위스 표현</span>
            )}
          </div>
          <h3 className="text-2xl font-bold leading-tight break-words">
            <Maskable masked={settings.hideGerman}>
              <Headword word={word} />
            </Maskable>
          </h3>
          {word.partOfSpeech === "noun" && word.plural && (
            <p className="text-muted mt-1 text-sm">복수 {word.plural}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <AudioRow audio={word.audio} kind="단어" />
        <a
          href={forvoUrl(word.german, word.partOfSpeech === "noun")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4"
        >
          Forvo에서 원어민 발음 듣기 ↗
        </a>
      </div>

      <Pronunciation data={word.pronunciation} showIpa={settings.showIpa} showKorean={settings.showKorean} />

      <p className="text-lg font-medium">
        <Maskable masked={settings.hideMeaning}>{word.meaning}</Maskable>
      </p>

      {word.swissNote && (
        <div className="mt-auto">
          <SwissTip>{word.swissNote}</SwissTip>
        </div>
      )}
    </article>
  );
}
