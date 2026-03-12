'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface LatencySession {
  /** ISO timestamp when the record was pushed to DealCloud */
  pushTime: string;
  /** The unique marker value embedded in the pushed record's Name field */
  marker: string;
  /** Entry type name for display */
  entryTypeName: string;
}

interface PollAttempt {
  at: string;
  found: boolean;
  elapsedMs?: number;
  error?: string;
}

type MonitorState = 'idle' | 'polling' | 'found' | 'error' | 'stopped';

const POLL_INTERVAL_MS = 5_000;

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const origin = new Date(startTime).getTime();
    const id = setInterval(() => setElapsed(Date.now() - origin), 500);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="font-mono tabular-nums">{formatMs(elapsed)}</span>;
}

interface LatencyMonitorProps {
  session: LatencySession | null;
}

export default function LatencyMonitor({ session }: LatencyMonitorProps) {
  const [snowflakeTable, setSnowflakeTable] = useState(
    process.env.NEXT_PUBLIC_SNOWFLAKE_TABLE ?? '',
  );
  const [snowflakeColumn, setSnowflakeColumn] = useState(
    process.env.NEXT_PUBLIC_SNOWFLAKE_COLUMN ?? 'NAME',
  );
  const [state, setState] = useState<MonitorState>('idle');
  const [attempts, setAttempts] = useState<PollAttempt[]>([]);
  const [finalLatencyMs, setFinalLatencyMs] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<LatencySession | null>(null);
  const pollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a new session arrives, automatically start polling
  useEffect(() => {
    if (!session) return;
    // Only auto-start if it's a new session (different marker)
    if (session.marker === activeSession?.marker) return;

    startPolling(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function clearTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  async function startPolling(s: LatencySession) {
    if (!snowflakeTable) return;
    clearTimer();
    pollingRef.current = true;
    setActiveSession(s);
    setAttempts([]);
    setFinalLatencyMs(null);
    setState('polling');
    schedulePoll(s);
  }

  function schedulePoll(s: LatencySession) {
    if (!pollingRef.current) return;
    timeoutRef.current = setTimeout(() => doPoll(s), POLL_INTERVAL_MS);
  }

  async function doPoll(s: LatencySession) {
    if (!pollingRef.current) return;

    try {
      const res = await fetch('/api/snowflake/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: snowflakeTable,
          column: snowflakeColumn,
          value: s.marker,
          pushTime: s.pushTime,
        }),
      });

      const data = await res.json() as {
        found: boolean;
        elapsedMs?: number;
        error?: string;
        searchedAt: string;
      };

      if (!res.ok || data.error) {
        setAttempts(prev => [
          { at: new Date().toISOString(), found: false, error: data.error ?? `HTTP ${res.status}` },
          ...prev,
        ]);
        setState('error');
        pollingRef.current = false;
        return;
      }

      const attempt: PollAttempt = {
        at: data.searchedAt,
        found: data.found,
        elapsedMs: data.elapsedMs,
      };
      setAttempts(prev => [attempt, ...prev]);

      if (data.found) {
        setFinalLatencyMs(data.elapsedMs ?? null);
        setState('found');
        pollingRef.current = false;
      } else {
        schedulePoll(s);
      }
    } catch (err) {
      setAttempts(prev => [
        {
          at: new Date().toISOString(),
          found: false,
          error: err instanceof Error ? err.message : String(err),
        },
        ...prev,
      ]);
      setState('error');
      pollingRef.current = false;
    }
  }

  function handleStop() {
    pollingRef.current = false;
    clearTimer();
    setState('stopped');
  }

  function handleManualStart() {
    if (activeSession) startPolling(activeSession);
    else if (session) startPolling(session);
  }

  const currentSession = activeSession ?? session;

  return (
    <div className="h-full flex flex-col gap-3 p-1">
      {/* Config row */}
      <div className="shrink-0 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Snowflake table:</span>
        <Input
          value={snowflakeTable}
          onChange={e => setSnowflakeTable(e.target.value)}
          placeholder="e.g. DB.SCHEMA.COMPANY"
          className="w-56 font-mono text-xs h-7"
        />
        <span className="text-xs text-muted-foreground">column:</span>
        <Input
          value={snowflakeColumn}
          onChange={e => setSnowflakeColumn(e.target.value)}
          placeholder="NAME"
          className="w-32 font-mono text-xs h-7"
        />
        {state === 'polling' ? (
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleStop}>
            Stop Polling
          </Button>
        ) : currentSession && state !== 'found' ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleManualStart}
            disabled={!snowflakeTable}
          >
            Start Polling
          </Button>
        ) : null}
      </div>

      {/* Status panel */}
      {!currentSession ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Push data to DealCloud first — the latency monitor will start automatically.
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Session info */}
          <div className="shrink-0 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Entry type:</span>
              <span className="font-medium">{currentSession.entryTypeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Pushed at:</span>
              <span className="font-mono text-xs">{currentSession.pushTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Marker:</span>
              <span className="font-mono text-xs truncate max-w-xs">{currentSession.marker}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-28 shrink-0">Status:</span>
              {state === 'polling' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    Polling every {POLL_INTERVAL_MS / 1000}s — elapsed{' '}
                    <ElapsedTimer startTime={currentSession.pushTime} />
                  </span>
                </span>
              )}
              {state === 'found' && finalLatencyMs !== null && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-400 font-semibold">
                    Found in Snowflake — latency:{' '}
                    <span className="font-mono">{formatMs(finalLatencyMs)}</span>
                  </span>
                </span>
              )}
              {state === 'stopped' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <span className="text-muted-foreground">Polling stopped</span>
                </span>
              )}
              {state === 'error' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-red-400">Error — check poll log below</span>
                </span>
              )}
              {state === 'idle' && (
                <span className="text-muted-foreground text-xs">
                  Configure table + column and click &quot;Start Polling&quot;
                </span>
              )}
            </div>

            {/* Big latency result */}
            {state === 'found' && finalLatencyMs !== null && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold font-mono tabular-nums text-green-400">
                    {formatMs(finalLatencyMs)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    DealCloud → Snowflake sync latency
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Poll attempt log */}
          {attempts.length > 0 && (
            <div className="flex-1 min-h-0 border border-border rounded-md overflow-hidden">
              <div className="text-xs font-medium px-3 py-1.5 border-b border-border bg-muted/50 flex items-center gap-2">
                Poll Attempts
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {attempts.length}
                </Badge>
              </div>
              <ScrollArea className="h-[calc(100%-32px)]">
                <div className="p-2 space-y-1">
                  {attempts.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs ${
                        a.found
                          ? 'bg-green-600/10 border border-green-600/20'
                          : a.error
                            ? 'bg-red-600/10 border border-red-600/20'
                            : 'bg-muted/30 border border-border'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          a.found ? 'bg-green-500' : a.error ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-muted-foreground">
                          {new Date(a.at).toLocaleTimeString()}
                        </span>{' '}
                        {a.found ? (
                          <span className="text-green-400 font-semibold">
                            FOUND — {formatMs(a.elapsedMs!)} latency
                          </span>
                        ) : a.error ? (
                          <span className="text-red-400">ERROR: {a.error}</span>
                        ) : (
                          <span className="text-muted-foreground">Not yet in Snowflake</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
