import { NextRequest, NextResponse } from 'next/server';
import { queryRowsPage } from '@/lib/dealcloud-api';

export async function POST(req: NextRequest) {
  try {
    const { entryTypeId, fieldIds, skip = 0, limit = 1000 } = (await req.json()) as {
      entryTypeId: number;
      fieldIds: number[];
      skip?: number;
      limit?: number;
    };

    if (!entryTypeId || !fieldIds?.length) {
      return NextResponse.json({ error: 'entryTypeId and fieldIds are required' }, { status: 400 });
    }

    const cappedLimit = Math.min(limit, 1000);
    const { rows, total } = await queryRowsPage(entryTypeId, fieldIds, skip, cappedLimit);

    return NextResponse.json({ rows, total, skip, limit: cappedLimit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
