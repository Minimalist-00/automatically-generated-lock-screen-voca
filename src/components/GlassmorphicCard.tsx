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
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#D1EAE5]/60 bg-white/95 p-3.5 shadow-[0_8px_24px_rgba(165,207,201,0.25)] backdrop-blur-md flex flex-col gap-2.5">
      {words.slice(0, 3).map((w, index) => (
        <div key={w.id || index} className="flex flex-col gap-1">
          {index > 0 && <div className="border-t-2 border-dashed border-[#A5CFC9]/30 pt-2" />}
          
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-sm sm:text-base font-bold text-[#58A498]">{w.word}</span>
            <span className="text-[10px] font-bold text-[#6B8B86]">{w.meaning}</span>
          </div>

          {w.scene && (
            <div className="flex">
              <span className="rounded-full bg-[#EAF5F2] px-2 py-0.5 text-[8px] font-bold text-[#4A6B65] break-words whitespace-normal max-w-full">
                🐚 {w.scene}
              </span>
            </div>
          )}

          {w.example && (
            <p className="text-[9px] font-medium leading-relaxed text-[#6B8B86] bg-[#F2F9F8] border border-[#D1EAE5]/50 p-1.5 rounded-lg whitespace-pre-line">
              {w.example}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
