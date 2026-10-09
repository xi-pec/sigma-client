import { useTimestamp } from "@/hooks/useTimestamp";
import { cn } from "@/utils/tailwind";

interface TimestampProps {
  timestamp: number;
  className?: string;
}

export function Timestamp({ timestamp, className }: TimestampProps) {
  const formattedTime = useTimestamp(timestamp);
  const fullDate = new Date(timestamp).toLocaleString();

  return (
    <time 
      dateTime={new Date(timestamp).toISOString()} 
      title={fullDate} 
      className={cn("text-xs text-muted", className)}
    >
      {formattedTime}
    </time>
  );
}