import { NextRequest, NextResponse } from 'next/server';
import { fetchSchemaFields } from '@/lib/dealcloud-api';

export async function POST(req: NextRequest) {
  try {
    const { entryTypeId } = (await req.json()) as { entryTypeId: number };
    if (!entryTypeId) return NextResponse.json({ error: 'entryTypeId is required' }, { status: 400 });

    const fields = await fetchSchemaFields(entryTypeId);
    return NextResponse.json({ fields });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
