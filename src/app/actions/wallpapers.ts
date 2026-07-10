'use server';

import { prisma } from '@/lib/prisma';
import { Wallpaper } from '@/types';
import { revalidatePath } from 'next/cache';
import { put, del } from '@vercel/blob';

function mapWallpaper(w: any): Wallpaper {
  return {
    ...w,
    created_at: w.created_at.toISOString()
  };
}

export async function getWallpapers(): Promise<Wallpaper[]> {
  const wallpapers = await prisma.wallpaper.findMany({
    orderBy: { created_at: 'desc' }
  });
  return wallpapers.map(mapWallpaper);
}

export async function uploadWallpaper(formData: FormData): Promise<Wallpaper> {
  const file = formData.get('file') as File;
  const name = formData.get('name') as string;

  if (!file || !name) {
    throw new Error('Missing file or name');
  }

  // Upload to Vercel Blob
  const blob = await put(`wallpapers/${file.name}`, file, {
    access: 'public',
  });

  // Save to DB
  const newWallpaper = await prisma.wallpaper.create({
    data: {
      name,
      storage_path: blob.pathname, // Or keep original logic
      public_url: blob.url,
    }
  });

  revalidatePath('/');
  revalidatePath('/wallpapers');
  return mapWallpaper(newWallpaper);
}

export async function renameWallpaper(id: string, name: string): Promise<Wallpaper> {
  const updatedWallpaper = await prisma.wallpaper.update({
    where: { id },
    data: { name }
  });
  
  revalidatePath('/');
  revalidatePath('/wallpapers');
  return mapWallpaper(updatedWallpaper);
}

export async function deleteWallpaper(id: string, publicUrl: string): Promise<boolean> {
  // Delete from DB first
  await prisma.wallpaper.delete({ where: { id } });
  
  // Delete from Vercel Blob if it's a blob URL
  if (publicUrl && publicUrl.includes('public.blob.vercel-storage.com')) {
    try {
      await del(publicUrl);
    } catch (error) {
      console.error('Failed to delete blob from Vercel:', error);
    }
  }

  revalidatePath('/');
  revalidatePath('/wallpapers');
  return true;
}
