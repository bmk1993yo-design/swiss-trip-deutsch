import type { Pronunciation as PronunciationData } from "@/types/lesson";

interface Props {
  data: PronunciationData;
  showIpa: boolean;
  showKorean: boolean;
  /** 문장은 덩어리 사이를 띄어 쓴다 */
  spaced?: boolean;
}

export default function Pronunciation({ data, showIpa, showKorean, spaced = false }: Props) {
  if (!showIpa && !showKorean) return null;
  return (
    <div className="space-y-1">
      {showIpa && <p className="ipa text-muted text-base">{data.ipa}</p>}
      {showKorean && (
        <p className="text-[15px]" aria-label="한국어 발음 도움">
          {data.korean.map((s, i) => (
            <span key={i}>
              {spaced && i > 0 && " "}
              {s.stress ? (
                <strong className="text-swiss underline decoration-2 underline-offset-4">{s.text}</strong>
              ) : (
                <span className="text-muted">{s.text}</span>
              )}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
