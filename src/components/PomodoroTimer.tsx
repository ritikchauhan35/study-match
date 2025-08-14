import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TimerMode = 'focus' | 'break';

export const PomodoroTimer = ({ defaultMinutes = 25 }: { defaultMinutes?: number }) => {
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [focusMinutes, setFocusMinutes] = useState(defaultMinutes);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!running) return;
    
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Play sound when timer ends
          if (audioRef.current) {
            audioRef.current.play().catch(err => console.error('Error playing sound:', err));
          }
          
          // Show notification
          toast(mode === 'focus' ? 'Focus session complete!' : 'Break time over!', {
            description: mode === 'focus' ? 'Time for a break!' : 'Ready to focus again?',
            duration: 5000,
          });
          
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  // Handle timer completion
  useEffect(() => {
    if (secondsLeft === 0) {
      setRunning(false);
      // Auto switch modes when timer completes
      if (!showSettings) {
        setTimeout(() => {
          switchMode();
        }, 1500);
      }
    }
  }, [secondsLeft]);
  
  // Switch between focus and break modes
  const switchMode = () => {
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setSecondsLeft((newMode === 'focus' ? focusMinutes : breakMinutes) * 60);
  };

  const reset = () => {
    setSecondsLeft((mode === 'focus' ? focusMinutes : breakMinutes) * 60);
    setRunning(false);
  };
  
  const toggleSettings = () => {
    setShowSettings(!showSettings);
    if (running) setRunning(false);
  };
  
  const handleFocusMinutesChange = (value: number[]) => {
    const minutes = value[0];
    setFocusMinutes(minutes);
    if (mode === 'focus' && !running) {
      setSecondsLeft(minutes * 60);
    }
  };
  
  const handleBreakMinutesChange = (value: number[]) => {
    const minutes = value[0];
    setBreakMinutes(minutes);
    if (mode === 'break' && !running) {
      setSecondsLeft(minutes * 60);
    }
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      {/* Mode indicator */}
      <div className="flex justify-center gap-2 mb-2">
        <Button 
          variant={mode === 'focus' ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (mode !== 'focus') {
              setMode('focus');
              setSecondsLeft(focusMinutes * 60);
              setRunning(false);
            }
          }}
          className={cn(
            "rounded-full px-4",
            mode === 'focus' ? "bg-primary text-primary-foreground" : ""
          )}
        >
          Focus
        </Button>
        <Button 
          variant={mode === 'break' ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (mode !== 'break') {
              setMode('break');
              setSecondsLeft(breakMinutes * 60);
              setRunning(false);
            }
          }}
          className={cn(
            "rounded-full px-4",
            mode === 'break' ? "bg-primary text-primary-foreground" : ""
          )}
        >
          Break
        </Button>
      </div>
      
      {/* Timer display */}
      <div className={cn(
        "flex flex-col items-center justify-center rounded-xl border p-6 transition-colors",
        mode === 'focus' ? "bg-primary/5" : "bg-secondary/5",
        secondsLeft === 0 ? "animate-pulse" : ""
      )}>
        <div className="text-4xl font-bold tabular-nums mb-4">{mm}:{ss}</div>
        <div className="flex gap-2">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => setRunning((r) => !r)}
            className="rounded-full h-10 w-10"
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={reset}
            className="rounded-full h-10 w-10"
          >
            <RotateCcw size={18} />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={toggleSettings}
            className="rounded-full h-10 w-10"
          >
            <Bell size={18} />
          </Button>
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 rounded-md border p-4 bg-card">
          <h4 className="text-sm font-medium mb-3">Timer Settings</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Focus Duration</span>
                <span className="text-sm font-medium">{focusMinutes} min</span>
              </div>
              <Slider
                defaultValue={[focusMinutes]}
                max={60}
                min={5}
                step={5}
                onValueChange={handleFocusMinutesChange}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Break Duration</span>
                <span className="text-sm font-medium">{breakMinutes} min</span>
              </div>
              <Slider
                defaultValue={[breakMinutes]}
                max={30}
                min={1}
                step={1}
                onValueChange={handleBreakMinutesChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
