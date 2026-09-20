'use server';

import { prisma } from '@/lib/prisma';
import { Word } from '@/types';
import { revalidatePath } from 'next/cache';

function mapWord(w: any): Word {
  return {
    ...w,
    created_at: w.created_at.toISOString()
  };
}

export async function getWords(): Promise<Word[]> {
  const words = await prisma.word.findMany({
    orderBy: [
      { sort_order: 'asc' },
      { created_at: 'desc' }
    ]
  });
  return words.map(mapWord);
}

export async function addWord(data: any): Promise<Word> {
  const minWord = await prisma.word.findFirst({
    where: { sort_order: { not: null } },
    orderBy: { sort_order: 'asc' },
    select: { sort_order: true }
  });
  
  const nextSortOrder = minWord?.sort_order !== undefined && minWord?.sort_order !== null 
    ? minWord.sort_order - 1 
    : 0;

  const newWord = await prisma.word.create({ 
    data: { ...data, sort_order: nextSortOrder }
  });
  revalidatePath('/');
  revalidatePath('/words');
  return mapWord(newWord);
}

export async function updateWord(id: string, data: any): Promise<Word> {
  const updatedWord = await prisma.word.update({
    where: { id },
    data
  });
  revalidatePath('/');
  revalidatePath('/words');
  return mapWord(updatedWord);
}

export async function deleteWord(id: string): Promise<boolean> {
  await prisma.word.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/words');
  return true;
}

export async function addWords(wordsData: any[]): Promise<Word[]> {
  const minWord = await prisma.word.findFirst({
    where: { sort_order: { not: null } },
    orderBy: { sort_order: 'asc' },
    select: { sort_order: true }
  });
  
  let currentSortOrder = minWord?.sort_order !== undefined && minWord?.sort_order !== null 
    ? minWord.sort_order - wordsData.length
    : -wordsData.length;

  const createdWords = await prisma.$transaction(
    wordsData.map(word => {
      const data = { ...word, sort_order: currentSortOrder++ };
      return prisma.word.create({ data });
    })
  );
  revalidatePath('/');
  revalidatePath('/words');
  return createdWords.map(mapWord);
}

export async function renameTag(oldTag: string, newTag: string): Promise<boolean> {
  const words = await prisma.word.findMany({});
  
  const updates = words.filter(w => (w.tags as string[] || []).includes(oldTag)).map(w => {
    const newTags = (w.tags as string[]).map(t => t === oldTag ? newTag : t);
    return prisma.word.update({
      where: { id: w.id },
      data: { tags: newTags }
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
    revalidatePath('/');
    revalidatePath('/words');
  }
  return true;
}

export async function deleteTag(tagToDelete: string): Promise<boolean> {
  const words = await prisma.word.findMany({});
  
  const updates = words.filter(w => (w.tags as string[] || []).includes(tagToDelete)).map(w => {
    const newTags = (w.tags as string[]).filter(t => t !== tagToDelete);
    return prisma.word.update({
      where: { id: w.id },
      data: { tags: newTags }
    });
  });

  if (updates.length > 0) {
    await prisma.$transaction(updates);
    revalidatePath('/');
    revalidatePath('/words');
  }
  return true;
}
