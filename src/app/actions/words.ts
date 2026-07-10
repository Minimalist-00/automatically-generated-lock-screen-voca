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
  const newWord = await prisma.word.create({ data });
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
  const createdWords = await prisma.$transaction(
    wordsData.map(word => prisma.word.create({ data: word }))
  );
  revalidatePath('/');
  revalidatePath('/words');
  return createdWords.map(mapWord);
}
