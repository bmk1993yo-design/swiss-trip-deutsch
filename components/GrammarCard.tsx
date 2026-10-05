import type { Grammar } from "@/types/lesson";

export default function GrammarCard({ grammar }: { grammar: Grammar }) {
  return (
    <article className="card p-5">
      <h3 className="text-xl font-bold">{grammar.title}</h3>
      <p className="mt-1 text-lg">{grammar.meaning}</p>
      <p className="text-muted mt-2 text-sm">{grammar.pattern}</p>

      <details className="group mt-4">
        <summary className="border-line cursor-pointer list-none rounded-xl border py-2.5 text-center text-sm font-semibold select-none">
          <span className="group-open:hidden">자세히 보기</span>
          <span className="hidden group-open:inline">접기</span>
        </summary>
        <div className="mt-4 space-y-4">
          <p className="leading-relaxed">{grammar.explanation}</p>
          <ul className="space-y-2">
            {grammar.examples.map((ex) => (
              <li key={ex.german} className="rounded-xl bg-black/4 px-3 py-2 dark:bg-white/5">
                <p className="font-semibold">{ex.german}</p>
                <p className="text-muted text-sm">{ex.meaning}</p>
              </li>
            ))}
          </ul>
          {grammar.tip && (
            <p className="text-sm leading-relaxed">
              <span className="font-bold">💡 팁 </span>
              {grammar.tip}
            </p>
          )}
        </div>
      </details>
    </article>
  );
}
