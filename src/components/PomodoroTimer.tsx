import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const PomodoroTimer = ({ minutes = 25 }: { minutes?: number }) => {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0) setRunning(false);
  }, [secondsLeft]);

  const reset = () => {
    setSecondsLeft(minutes * 60);
    setRunning(false);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="text-2xl font-semibold tabular-nums">{mm}:{ss}</div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</Button>
        <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
      </div>
    </div>
  );
};
