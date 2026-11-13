import {
  Tooltip
} from "@heroui/react"

import { useTimestamp } from "@/hooks/useTimestamp";
import { cn } from "@/utils/tailwind"

interface TimestampProps {
  timestamp: number;
  className?: string;
}

export function Timestamp({ timestamp, className }: TimestampProps) {
  const formattedTime = useTimestamp(timestamp);

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span className={cn("text-xs text-muted", className)}>
          {formattedTime}
        </span>
      </Tooltip.Trigger>

      <Tooltip.Content>
        <span>
          {new Date(timestamp).toLocaleString()}
        </span>
      </Tooltip.Content>
    </Tooltip>
    
  );
}