interface GlassmorphicCardProps {
  word: string;
  meaning: string;
  scene?: string;
  example?: string;
}

export default function GlassmorphicCard({ word, meaning, scene, example }: GlassmorphicCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-3 border-[#2D3748] bg-white/80 p-5 shadow-[3px_3px_0px_0px_#2D3748] backdrop-blur-md">
      <div className="flex flex-col gap-2">
        {scene && (
          <span className="self-start rounded-full bg-[#FEF08A] border-2 border-[#2D3748] px-2.5 py-0.5 text-[10px] font-black text-[#2D3748]">
            {scene}
          </span>
        )}
        
        <div>
          <h3 className="text-xl font-black tracking-tight text-[#2D3748]">{word}</h3>
          <p className="mt-0.5 text-xs font-bold text-[#4A5568]">{meaning}</p>
        </div>

        {example && (
          <div className="mt-1 border-t-2 border-dashed border-[#2D3748]/15 pt-2">
            <p className="text-[9px] text-[#718096] uppercase tracking-wider font-extrabold">例文</p>
            <p className="mt-0.5 text-xs font-bold text-[#2D3748] whitespace-pre-line leading-relaxed">{example}</p>
          </div>
        )}
      </div>
    </div>
  );
}
