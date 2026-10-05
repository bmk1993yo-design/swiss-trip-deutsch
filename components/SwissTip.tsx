export default function SwissTip({ children }: { children: string }) {
  return (
    <div className="rounded-xl bg-swiss/8 px-3 py-2.5 text-sm leading-relaxed">
      <p className="mb-0.5 text-xs font-bold tracking-wide text-swiss">🇨🇭 SWISS TIP</p>
      <p>{children}</p>
    </div>
  );
}
