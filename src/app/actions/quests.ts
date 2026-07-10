'use server';

import { prisma } from '@/lib/prisma';
import { Quest } from '@/types';
import { revalidatePath } from 'next/cache';

function mapQuest(q: any): Quest {
  return {
    ...q,
    quest_date: q.quest_date.toISOString().split('T')[0], // Map to YYYY-MM-DD string as expected by frontend if needed
    created_at: q.created_at.toISOString()
  };
}

export async function getTodayQuest(): Promise<Quest | null> {
  const quest = await prisma.quest.findFirst({
    orderBy: { created_at: 'desc' }
  });
  return quest ? mapQuest(quest) : null;
}

export async function upsertTodayQuest(wordIds: string[]): Promise<Quest> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize to date

  // Prisma doesn't have a simple upsert by a non-unique field if quest_date wasn't marked @unique.
  // Wait, in schema.prisma, quest_date is @unique!
  
  const quest = await prisma.quest.upsert({
    where: {
      quest_date: today
    },
    update: {
      word_ids: wordIds
    },
    create: {
      quest_date: today,
      word_ids: wordIds
    }
  });

  revalidatePath('/');
  revalidatePath('/words');
  return mapQuest(quest);
}

export async function clearTodayQuestWords(id: string): Promise<Quest> {
  const quest = await prisma.quest.update({
    where: { id },
    data: { word_ids: [] }
  });
  
  revalidatePath('/');
  revalidatePath('/words');
  return mapQuest(quest);
}
