'use client';

import React, { useState } from 'react';

interface Wallpaper {
  id: string;
  name: string;
  public_url: string;
  created_at: string;
}

const INITIAL_WALLPAPERS: Wallpaper[] = [
  {
    id: '1',
    name: 'Purple Gradient',
    public_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Green Abstract Art',
    public_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

export default function WallpapersPage() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(INITIAL_WALLPAPERS);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const newWallpaper: Wallpaper = {
      id: Math.random().toString(),
      name,
      public_url: url,
      created_at: new Date().toISOString()
    };

    setWallpapers([newWallpaper, ...wallpapers]);
    setName('');
    setUrl('');
  };

  return (
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-3xl font-black text-[#2D3748] flex items-center gap-2">
          <span>🖼️</span> Manage Wallpapers
        </h2>
        <p className="text-[#4A5568] mt-2 font-medium">Configure and upload wallpapers to be used as backgrounds for your lock screen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 壁紙登録フォーム */}
        <div className="cute-card p-6 bg-[#FBCFE8]/30">
          <h3 className="text-lg font-black text-[#2D3748] mb-4 flex items-center gap-1.5">
            <span>➕</span> Add New Wallpaper
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Wallpaper Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My favorite wallpaper"
                className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Image URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full cute-input px-4 py-2.5 text-[#2D3748] placeholder-gray-400 text-sm font-semibold"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full cute-btn py-3 text-sm transition-transform active:scale-95"
            >
              Add Wallpaper
            </button>
          </form>
        </div>

        {/* 壁紙一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-[#2D3748]">Saved Wallpapers ({wallpapers.length})</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {wallpapers.map((wallpaper) => (
              <div key={wallpaper.id} className="group relative rounded-3xl overflow-hidden border-3 border-[#2D3748] bg-white shadow-[3px_3px_0px_0px_#2D3748] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#2D3748] transition-all">
                <div 
                  className="aspect-[9/16] bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{ backgroundImage: `url(${wallpaper.public_url})` }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-10">
                  <p className="text-sm font-bold text-white truncate">{wallpaper.name}</p>
                </div>
              </div>
            ))}
          </div>

          {wallpapers.length === 0 && (
            <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
              No wallpapers saved yet. Add some using the form above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
