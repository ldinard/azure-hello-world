import { NextRequest, NextResponse } from 'next/server';
import { createRows, fetchSchemaFields } from '@/lib/dealcloud-api';
import { entryTypes, getWritableFields } from '@/lib/dealcloud-schema';

interface LiveField {
  apiName: string;
  fieldId: number;
  fieldType?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { entryTypeId, rows } = (await req.json()) as {
      entryTypeId: number;
      rows: Record<string, unknown>[];
    };

    if (!entryTypeId || !rows?.length) {
      return NextResponse.json({ error: 'entryTypeId and rows are required' }, { status: 400 });
    }

    // Attempt live schema fetch; fall back to hardcoded schema
    let choiceApiNames = new Set<string>();
    try {
      const liveFields = (await fetchSchemaFields(entryTypeId)) as LiveField[];
      choiceApiNames = new Set(
        liveFields.filter(f => f.fieldType === 'Choice').map(f => f.apiName),
      );
    } catch {
      // Fall back to local schema
      const localFields = getWritableFields(entryTypeId);
      choiceApiNames = new Set(
        localFields.filter(f => f.fieldType === 'Choice').map(f => f.apiName),
      );
    }

    // Normalize and filter rows
    const normalizedRows = rows.map(row => {
      const out: Record<string, unknown> = { EntryId: -1 };
      for (const [k, v] of Object.entries(row)) {
        if (k === 'EntryId') continue;
        if (choiceApiNames.has(k)) continue;
        out[k] = v;
      }
      return out;
    });

    const { created, failed, results } = await createRows(entryTypeId, normalizedRows);
    return NextResponse.json({ created, failed, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
