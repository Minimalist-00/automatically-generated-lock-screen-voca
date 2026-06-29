'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

import { useStore, Wallpaper } from '@/contexts/StoreContext';

export default function WallpapersPage() {
  const { wallpapers, setWallpapers, loading } = useStore();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');

  useEffect(() => {
    setSelectedUrl(localStorage.getItem('selectedWallpaper') || '');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    setUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 3. Save to DB
      const { data, error } = await supabase
        .from('wallpapers')
        .insert([{ name, storage_path: filePath, public_url: publicUrl }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setWallpapers([data, ...wallpapers]);
      }
      setName('');
      setFile(null);
      // Reset file input (via form reset or key)
      const fileInput = document.getElementById('wallpaper-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error(err);
      alert('Failed to upload wallpaper. Make sure the storage bucket "wallpapers" is created and public.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectWallpaper = (url: string) => {
    localStorage.setItem('selectedWallpaper', url);
    setSelectedUrl(url);
    alert('Wallpaper set! Check it out on the top page.');
  };

  const handleUpdateName = async (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    const newName = window.prompt('Please enter a name for the new wallpaper:', currentName);
    if (!newName || newName === currentName) return;

    try {
      const { error } = await supabase.from('wallpapers').update({ name: newName }).eq('id', id);
      if (error) throw error;
      setWallpapers(wallpapers.map(w => w.id === id ? { ...w, name: newName } : w));
    } catch (error) {
      console.error('Error updating wallpaper name:', error);
      alert('Failed to update the name.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, storagePath?: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this?')) return;

    try {
      const { error: dbError } = await supabase.from('wallpapers').delete().eq('id', id);
      if (dbError) throw dbError;

      if (storagePath) {
        const { error: storageError } = await supabase.storage.from('wallpapers').remove([storagePath]);
        if (storageError) console.error('Failed to delete from storage:', storageError);
      }

      setWallpapers(wallpapers.filter(w => w.id !== id));
      
      // If deleted wallpaper was selected, clear selection
      const currentSelected = localStorage.getItem('selectedWallpaper');
      const deletedWallpaper = wallpapers.find(w => w.id === id);
      if (deletedWallpaper && currentSelected === deletedWallpaper.public_url) {
        localStorage.removeItem('selectedWallpaper');
        setSelectedUrl('');
      }
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
      alert('Failed to delete.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="wallpaper" title="Manage Wallpapers" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 壁紙登録フォーム */}
        <div className="cute-card p-6 bg-[#FBCFE8]/30">
          <h3 className="text-lg font-black text-[#2D3748] mb-4 flex items-center gap-1.5">
            <span className="material-symbols-rounded">add_circle</span> Add New Wallpaper
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
              <label className="block text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-2">Image File</label>
              <input
                id="wallpaper-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full cute-input px-4 py-2 text-[#2D3748] text-sm font-semibold file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#4A6B65] file:text-white hover:file:bg-[#38524D] cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full cute-btn py-3 text-sm transition-transform active:scale-95 disabled:opacity-50 flex justify-center items-center"
            >
              {uploading ? 'Uploading...' : 'Upload Wallpaper'}
            </button>
          </form>
        </div>

        {/* 壁紙一覧 */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-lg font-black text-[#2D3748]">Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <button 
                onClick={() => handleSelectWallpaper('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80')}
                className={`aspect-[9/16] rounded-3xl overflow-hidden hover:-translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_#2D3748] hover:shadow-[5px_5px_0px_0px_#2D3748] border-3 border-[#2D3748] relative group ${selectedUrl === 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&auto=format&fit=crop&q=80' ? 'ring-4 ring-[#58A498] ring-offset-2' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#92D0C6] to-[#EAF5F2]" />
                <span className="absolute bottom-4 left-4 text-sm font-bold text-[#4A6B65] bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">Ocean</span>
              </button>
              
              <button 
                onClick={() => handleSelectWallpaper('https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=600&auto=format&fit=crop&q=80')}
                className={`aspect-[9/16] rounded-3xl overflow-hidden hover:-translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_#2D3748] hover:shadow-[5px_5px_0px_0px_#2D3748] border-3 border-[#2D3748] relative group ${selectedUrl === 'https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=600&auto=format&fit=crop&q=80' ? 'ring-4 ring-[#58A498] ring-offset-2' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#7BC0B5] to-[#A5CFC9]" />
                <span className="absolute bottom-4 left-4 text-sm font-bold text-[#4A6B65] bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">Deep Sea</span>
              </button>

              <button 
                onClick={() => handleSelectWallpaper('')}
                className={`aspect-[9/16] rounded-3xl border-3 border-dashed border-[#2D3748] bg-white/50 hover:bg-white/80 hover:-translate-y-0.5 transition-all shadow-[3px_3px_0px_0px_#2D3748] hover:shadow-[5px_5px_0px_0px_#2D3748] flex flex-col items-center justify-center text-sm text-[#4A6B65] font-bold gap-1 ${selectedUrl === '' ? 'ring-4 ring-[#58A498] ring-offset-2 border-solid' : ''}`}
              >
                <span>Default</span>
                <span className="text-xs opacity-75">(Soft Mint)</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-[#2D3748]">Saved Wallpapers ({wallpapers.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {wallpapers.map((wallpaper) => (
              <div 
                key={wallpaper.id} 
                onClick={() => handleSelectWallpaper(wallpaper.public_url)}
                className={`group relative rounded-3xl overflow-hidden border-3 border-[#2D3748] bg-white shadow-[3px_3px_0px_0px_#2D3748] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#2D3748] transition-all cursor-pointer ${selectedUrl === wallpaper.public_url ? 'ring-4 ring-[#58A498] ring-offset-2' : ''}`}
              >
                <div 
                  className="aspect-[9/16] bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{ backgroundImage: `url(${wallpaper.public_url})` }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12 flex justify-between items-end">
                  <p className="text-sm font-bold text-white truncate mr-2">{wallpaper.name}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleUpdateName(e, wallpaper.id, wallpaper.name)}
                      className="text-white hover:text-[#58A498] transition-colors"
                      title="Rename"
                    >
                      <span className="material-symbols-rounded text-xl">edit</span>
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, wallpaper.id, wallpaper.storage_path)}
                      className="text-white hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-rounded text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {loading ? (
              <div className="text-center py-12 font-bold text-gray-500">Loading wallpapers...</div>
            ) : wallpapers.length === 0 ? (
              <div className="text-center py-12 border-3 border-dashed border-[#2D3748] rounded-3xl text-gray-500 bg-white/50 font-bold">
                No wallpapers saved yet. Add some using the form above.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
