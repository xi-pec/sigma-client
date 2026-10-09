import { useState, useEffect } from "react";
import { relative } from "@/utils/timestamps";

export function useTimestamp(timestamp: number, refresh = 60000) {
  const [time, setTime] = useState(() => relative(timestamp));

  useEffect(() => {
    setTime(relative(timestamp));

    const interval = setInterval(() => {
      setTime(relative(timestamp));
    }, refresh);

    return () => clearInterval(interval);
  }, [timestamp, refresh]);

  return time;
}