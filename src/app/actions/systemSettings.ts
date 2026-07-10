'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemSettings(keys?: string[]) {
  const query = keys && keys.length > 0 
    ? { where: { key: { in: keys } } }
    : undefined;
    
  const settings = await prisma.systemSetting.findMany(query);
  
  return settings.map(s => ({
    key: s.key,
    value: s.value,
    updated_at: s.updated_at.toISOString()
  }));
}

export async function upsertSystemSettings(settings: { key: string; value: string }[]) {
  // Prisma doesn't have a built-in upsertMany, so we use a transaction
  await prisma.$transaction(
    settings.map(setting => 
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value }
      })
    )
  );

  revalidatePath('/');
  revalidatePath('/settings');
  revalidatePath('/words');
  return true;
}
