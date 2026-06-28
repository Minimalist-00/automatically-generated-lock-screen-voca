import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#D1EAE5] px-4 py-2.5 shadow-[0_4px_16px_rgba(165,207,201,0.2)]">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-[#4A6B65] hover:opacity-85 transition-opacity">
          <svg className="w-7 h-7 text-[#58A498]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="6" fill="#C6E7E1" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <span className="tracking-tight text-lg">Lock Screen Voca</span>
        </Link>
        
        {/* Navigation Items - Circular Icons Only */}
        <div className="flex items-center gap-2.5">
          <Link 
            href="/words" 
            title="単語管理"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E0F2EF] hover:bg-[#C6E7E1] text-[#4A6B65] transition-all shadow-[0_4px_12px_rgba(165,207,201,0.3)] hover:shadow-[0_6px_16px_rgba(165,207,201,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(165,207,201,0.3)]"
          >
            <svg className="w-5.5 h-5.5 text-[#58A498]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-16.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-16.25v14.25" />
            </svg>
          </Link>
          <Link 
            href="/wallpapers" 
            title="壁紙管理"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E4F3FA] hover:bg-[#BAE2F5] text-[#4A6B65] transition-all shadow-[0_4px_12px_rgba(186,226,245,0.4)] hover:shadow-[0_6px_16px_rgba(186,226,245,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_8px_rgba(186,226,245,0.4)]"
          >
            <svg className="w-5.5 h-5.5 text-[#5D9CCF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

