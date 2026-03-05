import { NextRequest, NextResponse } from 'next/server';
import { createRows } from '@/lib/dealcloud-api';

const BATCH_SIZE = 1000;
const BATCH_DELAY_MS = 500;

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

    let totalCreated = 0;
    let totalFailed = 0;
    const batchLogs: { batch: number; created: number; failed: number; error?: string }[] = [];
    let firstSampleErrors: unknown[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
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
        const msg = err instanceof Error ? err.message.slice(0, 200) : 'Unknown error';
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
