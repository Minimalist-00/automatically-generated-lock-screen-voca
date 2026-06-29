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
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#D1EAE5]/60 bg-white/95 p-5 shadow-[0_8px_24px_rgba(165,207,201,0.25)] backdrop-blur-md flex flex-col gap-6">
      {words.slice(0, 3).map((w, index) => (
        <div key={w.id || index} className="flex flex-col gap-3">
          
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold text-[#58A498] leading-none">{w.word}</span>
            <span className="text-[11px] font-bold text-[#6B8B86] leading-snug">{w.meaning}</span>
          </div>

          {w.scene && (
            <div className="flex">
              <span className="rounded-full bg-[#EAF5F2] px-3 py-1.5 text-[8.5px] font-bold text-[#4A6B65] break-words whitespace-normal max-w-full leading-tight inline-flex items-center gap-0.5">
                <span className="material-symbols-rounded text-[11px]">lightbulb</span> {w.scene}
              </span>
            </div>
          )}

          {w.example && (
            <p className="text-[9.5px] font-medium leading-relaxed text-[#6B8B86] bg-[#F2F9F8] border border-[#D1EAE5]/50 p-3 rounded-xl whitespace-pre-line">
              {w.example}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
