import { cn } from '@/lib/utils';

export interface LogEntry {
  id: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
  timestamp: Date;
}

const typeStyles: Record<LogEntry['type'], string> = {
  info:    'text-blue-500',
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
};

const typeLabels: Record<LogEntry['type'], string> = {
  info:    'INFO',
  success: 'OK',
  error:   'ERR',
  warning: 'WARN',
};

interface PushLogProps {
  entries: LogEntry[];
}

export default function PushLog({ entries }: PushLogProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1 font-mono text-xs">
      {entries.map(entry => (
        <div key={entry.id} className="flex gap-2 py-1 border-b border-border last:border-0">
          <span className="text-muted-foreground shrink-0">
            {entry.timestamp.toLocaleTimeString()}
          </span>
          <span className={cn('font-bold shrink-0 w-8', typeStyles[entry.type])}>
            {typeLabels[entry.type]}
          </span>
          <div className="min-w-0">
            <span className="text-foreground">{entry.message}</span>
            {entry.detail && (
              <div className="text-muted-foreground mt-0.5 truncate">{entry.detail}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
