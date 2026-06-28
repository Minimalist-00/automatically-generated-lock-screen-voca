interface WordItem {
  id: string;
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
}

interface GlassmorphicCardProps {
  words: WordItem[];
}

export default function GlassmorphicCard({ words }: GlassmorphicCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-3 border-[#2D3748] bg-white/90 p-3.5 shadow-[3px_3px_0px_0px_#2D3748] backdrop-blur-md flex flex-col gap-2.5">
      {words.slice(0, 3).map((w, index) => (
        <div key={w.id || index} className="flex flex-col gap-1">
          {index > 0 && <div className="border-t-2 border-dashed border-[#2D3748]/10 pt-2" />}
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-sm sm:text-base font-black text-[#2B6CB0]">{w.word}</span>
              <span className="text-[10px] font-bold text-[#4A5568]">{w.meaning}</span>
            </div>
            {w.scene && (
              <span className="shrink-0 rounded-full bg-[#FEF08A] border-2 border-[#2D3748] px-1.5 py-0.2 text-[8px] font-black text-[#2D3748] self-center">
                {w.scene}
              </span>
            )}
          </div>

          {w.example && (
            <p className="text-[9px] font-medium leading-relaxed text-[#2D3748] bg-slate-50 border border-[#2D3748]/5 p-1.5 rounded-lg whitespace-pre-line">
              {w.example}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
