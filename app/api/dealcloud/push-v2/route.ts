import { NextRequest, NextResponse } from 'next/server';
import { createRows, fetchSchemaFields } from '@/lib/dealcloud-api';
import { getWritableFields } from '@/lib/dealcloud-schema';

const BATCH_SIZE = 1000;
const BATCH_DELAY_MS = 500;

interface LiveField {
  apiName: string;
  fieldType?: string;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    // Fetch live schema to get accurate Choice field names; fall back to hardcoded schema.
    // This mirrors the approach in push/route.ts to ensure Choice fields are always filtered
    // even when the hardcoded schema diverges from the actual DealCloud instance.
    let choiceApiNames = new Set<string>();
    try {
      const liveFields = (await fetchSchemaFields(entryTypeId)) as LiveField[];
      choiceApiNames = new Set(
        liveFields.filter(f => f.fieldType === 'Choice').map(f => f.apiName),
      );
    } catch {
      const localFields = getWritableFields(entryTypeId);
      choiceApiNames = new Set(
        localFields.filter(f => f.fieldType === 'Choice').map(f => f.apiName),
      );
    }

    // Normalize rows: re-assert EntryId: -1 and strip any Choice fields
    const normalizedRows = rows.map(row => {
      const out: Record<string, unknown> = { EntryId: -1 };
      for (const [k, v] of Object.entries(row)) {
        if (k === 'EntryId') continue;
        if (choiceApiNames.has(k)) continue;
        out[k] = v;
      }
      return out;
    });

    let totalCreated = 0;
    let totalFailed = 0;
    const batchLogs: { batch: number; created: number; failed: number; error?: string }[] = [];
    let firstSampleErrors: unknown[] = [];

    for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
      const batch = normalizedRows.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);

      if (i > 0) await delay(BATCH_DELAY_MS);

      try {
        const { created, failed, sampleErrors } = await createRows(entryTypeId, batch);
        totalCreated += created;
        totalFailed += failed;
        batchLogs.push({ batch: batchIndex, created, failed });
        if (firstSampleErrors.length === 0 && sampleErrors.length > 0) {
          firstSampleErrors = sampleErrors;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message.slice(0, 500) : 'Unknown error';
        batchLogs.push({ batch: batchIndex, created: 0, failed: batch.length, error: msg });
        totalFailed += batch.length;
      }
    }

    return NextResponse.json({
      created: totalCreated,
      failed: totalFailed,
      batches: batchLogs,
      sampleErrors: firstSampleErrors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
