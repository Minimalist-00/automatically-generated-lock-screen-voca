import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { updates } = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    // Process updates in parallel or sequentially.
    // Since Supabase JS client doesn't have a bulk update for different rows easily without writing a postgres function,
    // we can do individual updates in a Promise.all for a small number of rows, or upsert.
    // Upsert needs all required fields, so it's safer to just do multiple updates.
    
    const updatePromises = updates.map(({ id, sort_order }) => {
      return supabase
        .from('words')
        .update({ sort_order })
        .eq('id', id);
    });

    const results = await Promise.all(updatePromises);
    
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating sort order:', errors);
      return NextResponse.json({ error: 'Failed to update some items' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reorder error:', err);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
