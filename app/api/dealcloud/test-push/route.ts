import { NextRequest, NextResponse } from 'next/server';
import { createRows } from '@/lib/dealcloud-api';

export async function POST(req: NextRequest) {
  try {
    const { entryTypeId } = (await req.json()) as { entryTypeId: number };
    if (!entryTypeId) {
      return NextResponse.json({ error: 'entryTypeId is required' }, { status: 400 });
    }

    const result = await createRows(entryTypeId, [
      { EntryId: -1, Name: `Test-${Date.now().toString(36)}` },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
