import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    // Process updates in a transaction
    await prisma.$transaction(
      updates.map(({ id, sort_order }) => {
        return prisma.word.update({
          where: { id },
          data: { sort_order }
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reorder error:', err);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
