import { NextRequest } from 'next/server';
import { entryTypes, getWritableFields } from '@/lib/dealcloud-schema';
import { generateSampleRecord, toRowApiPayload, resetRunId } from '@/lib/sample-data-generator';
import { createRows } from '@/lib/dealcloud-api';

const BATCH_SIZE = 1000;
const BATCH_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { entryTypeId, count } = (await req.json()) as { entryTypeId: number; count: number };

  const entryType = entryTypes.find(et => et.objectId === entryTypeId);
  if (!entryType) {
    return new Response('Invalid entry type', { status: 400 });
  }
  if (!count || count < 1) {
    return new Response('count must be >= 1', { status: 400 });
  }

  const writableFields = getWritableFields(entryTypeId);
  const totalBatches = Math.ceil(count / BATCH_SIZE);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      // Abort when client disconnects
      req.signal.addEventListener('abort', () => {
        controller.close();
      });

      try {
        send({ type: 'start', total: count, totalBatches });
        resetRunId();

        let totalCreated = 0;
        let totalFailed = 0;

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          if (req.signal.aborted) break;

          const remaining = count - batchIndex * BATCH_SIZE;
          const batchCount = Math.min(remaining, BATCH_SIZE);

          // Generate batch server-side
          const payload: Record<string, unknown>[] = [];
          for (let i = 0; i < batchCount; i++) {
            const record = generateSampleRecord(writableFields);
            payload.push(toRowApiPayload(record, writableFields));
          }

          try {
            const { created, failed } = await createRows(entryTypeId, payload);
            totalCreated += created;
            totalFailed += failed;

            const percent = Math.round(((batchIndex + 1) / totalBatches) * 100);
            send({
              type: 'batch_done',
              batchIndex,
              batchNum: batchIndex + 1,
              totalBatches,
              created,
              failed,
              totalCreated,
              percent,
            });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message.slice(0, 200) : 'Unknown error';
            send({ type: 'batch_error', batchIndex, error: errMsg });
          }

          if (batchIndex < totalBatches - 1 && !req.signal.aborted) {
            await delay(BATCH_DELAY_MS);
          }
        }

        send({ type: 'done', totalCreated, totalFailed });
      } catch (err) {
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
