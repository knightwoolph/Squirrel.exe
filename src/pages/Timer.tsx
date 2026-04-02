import { useEffect, useRef, useState } from 'react';
import { useTimerStore, useTodaysSessions, type TimerMode } from '../stores/timerStore';
import { useTasks } from '../stores/taskStore';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock,
  Coffee,
  Brain,
  Target,
  Settings2,
  Flame,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

export function Timer() {
  const {
    mode,
    timeRemaining,
    isRunning,
    isPaused,
    sessionsCompleted,
    currentTaskId,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    sessionsUntilLongBreak,
    autoStartBreaks,
    autoStartFocus,
    setMode,
    start,
    pause,
    resume,
    reset,
    skip,
    tick,
    setCurrentTask,
    setFocusDuration,
    setShortBreakDuration,
    setLongBreakDuration,
    setSessionsUntilLongBreak,
    setAutoStartBreaks,
    setAutoStartFocus,
  } = useTimerStore();

  const todaysSessions = useTodaysSessions();
  const tasks = useTasks(undefined, false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isTaskSelectOpen, setTaskSelectOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Local settings state (committed on dialog close)
  const [localFocus, setLocalFocus] = useState(focusDuration);
  const [localShort, setLocalShort] = useState(shortBreakDuration);
  const [localLong, setLocalLong] = useState(longBreakDuration);
  const [localSessions, setLocalSessions] = useState(sessionsUntilLongBreak);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'short-break' ? 'Break' : 'Long Break';
    document.title = isRunning ? `${timeString} - ${modeLabel} | SQRL` : 'Timer | SQRL';
    return () => { document.title = 'SQRL'; };
  }, [timeRemaining, mode, isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = (m: TimerMode) => {
    switch (m) {
      case 'focus':
        return {
          label: 'Focus',
          icon: Brain,
          color: 'text-[var(--accent-primary)]',
          ringColor: 'var(--accent-primary)',
          gradientId: 'focusGradient',
          gradientStart: '#f97316',
          gradientEnd: '#ef4444',
        };
      case 'short-break':
        return {
          label: 'Short Break',
          icon: Coffee,
          color: 'text-emerald-500',
          ringColor: '#10b981',
          gradientId: 'shortBreakGradient',
          gradientStart: '#10b981',
          gradientEnd: '#06b6d4',
        };
      case 'long-break':
        return {
          label: 'Long Break',
          icon: Clock,
          color: 'text-blue-500',
          ringColor: '#3b82f6',
          gradientId: 'longBreakGradient',
          gradientStart: '#3b82f6',
          gradientEnd: '#8b5cf6',
        };
    }
  };

  const getProgressPercent = () => {
    let totalSeconds: number;
    switch (mode) {
      case 'focus': totalSeconds = focusDuration * 60; break;
      case 'short-break': totalSeconds = shortBreakDuration * 60; break;
      case 'long-break': totalSeconds = longBreakDuration * 60; break;
    }
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };

  const currentTask = tasks?.find((t) => t.id === currentTaskId);
  const modeConfig = getModeConfig(mode);
  const ModeIcon = modeConfig.icon;

  const RADIUS = 130;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progressOffset = CIRCUMFERENCE * (1 - getProgressPercent() / 100);

  const handleOpenSettings = () => {
    setLocalFocus(focusDuration);
    setLocalShort(shortBreakDuration);
    setLocalLong(longBreakDuration);
    setLocalSessions(sessionsUntilLongBreak);
    setSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setFocusDuration(Math.max(1, localFocus));
    setShortBreakDuration(Math.max(1, localShort));
    setLongBreakDuration(Math.max(1, localLong));
    setSessionsUntilLongBreak(Math.max(1, localSessions));
    setSettingsOpen(false);
  };

  const sessionsInCycle = sessionsCompleted % sessionsUntilLongBreak;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full">

      {/* Mode Tabs */}
      <Tabs
        value={mode}
        onValueChange={(v) => !isRunning && setMode(v as TimerMode)}
        className="mb-8 w-full max-w-sm"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="focus" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="h-3.5 w-3.5" />
            Focus
          </TabsTrigger>
          <TabsTrigger value="short-break" className="gap-1.5 text-xs sm:text-sm">
            <Coffee className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Short </span>Break
          </TabsTrigger>
          <TabsTrigger value="long-break" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Long </span>Break
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Timer Ring */}
      <div className="relative mb-8 flex items-center justify-center">
        <svg
          width="300"
          height="300"
          className="-rotate-90"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={modeConfig.gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={modeConfig.gradientStart} />
              <stop offset="100%" stopColor={modeConfig.gradientEnd} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="150"
            cy="150"
            r={RADIUS}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="10"
          />
          {/* Progress */}
          <circle
            cx="150"
            cy="150"
            r={RADIUS}
            fill="none"
            stroke={`url(#${modeConfig.gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div
            className={cn(
              'text-6xl font-bold tabular-nums tracking-tight',
              'text-[var(--text-primary)]'
            )}
          >
            {formatTime(timeRemaining)}
          </div>
          <div className={cn('flex items-center gap-1.5 text-sm font-medium', modeConfig.color)}>
            <ModeIcon className="h-4 w-4" />
            {modeConfig.label}
          </div>
          {isRunning && (
            <Badge
              variant="secondary"
              className="mt-1 text-xs animate-pulse"
            >
              <Flame className="h-3 w-3 mr-1" />
              Running
            </Badge>
          )}
          {isPaused && (
            <Badge variant="outline" className="mt-1 text-xs">
              Paused
            </Badge>
          )}
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <Card className="mb-6 w-full max-w-sm">
          <CardContent className="px-4 py-3">
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Working on</p>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
              <p className="font-medium text-sm truncate">{currentTask.title}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-8">
        {!isRunning && !isPaused && (
          <Button size="lg" onClick={start} className="gap-2 px-8">
            <Play className="h-5 w-5" />
            Start
          </Button>
        )}
        {isRunning && (
          <Button size="lg" variant="secondary" onClick={pause} className="gap-2 px-8">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
        )}
        {isPaused && (
          <>
            <Button size="lg" onClick={resume} className="gap-2 px-6">
              <Play className="h-5 w-5" />
              Resume
            </Button>
            <Button size="lg" variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={skip}
          title="Skip to next phase"
          className="h-10 w-10"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6 sm:grid-cols-4">
        <button
          onClick={() => setTaskSelectOpen(true)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--radius-lg)]"
        >
          <Card className="h-full hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-[var(--accent-primary)]" />
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                {currentTask ? 'Change Task' : 'Select Task'}
              </p>
            </CardContent>
          </Card>
        </button>

        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {sessionsCompleted}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {todaysSessions?.totalMinutes || 0}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Min Focused</p>
          </CardContent>
        </Card>

        <button
          onClick={handleOpenSettings}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--radius-lg)]"
        >
          <Card className="h-full hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
            <CardContent className="p-3 text-center">
              <Settings2 className="h-5 w-5 mx-auto mb-1 text-[var(--text-muted)]" />
              <p className="text-xs text-[var(--text-muted)]">Settings</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Cycle Progress */}
      <Card className="w-full max-w-sm">
        <CardContent className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-muted)]">Cycle progress</p>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              {sessionsInCycle} / {sessionsUntilLongBreak}
            </p>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all duration-500',
                  i < sessionsInCycle
                    ? 'bg-[var(--accent-primary)]'
                    : 'bg-[var(--border-default)]'
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Select Dialog */}
      <Dialog open={isTaskSelectOpen} onOpenChange={setTaskSelectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Task to Focus On</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
            <button
              className={cn(
                'p-3 rounded-[var(--radius-md)] text-left transition-colors text-sm',
                'hover:bg-[var(--bg-tertiary)]',
                !currentTaskId && 'bg-[var(--bg-tertiary)] ring-1 ring-[var(--accent-primary)]'
              )}
              onClick={() => { setCurrentTask(null); setTaskSelectOpen(false); }}
            >
              <p className="font-medium text-[var(--text-primary)]">No specific task</p>
              <p className="text-xs text-[var(--text-muted)]">Just focus on anything</p>
            </button>

            {tasks?.map((task) => (
              <button
                key={task.id}
                className={cn(
                  'p-3 rounded-[var(--radius-md)] text-left transition-colors text-sm',
                  'hover:bg-[var(--bg-tertiary)]',
                  currentTaskId === task.id && 'bg-[var(--bg-tertiary)] ring-1 ring-[var(--accent-primary)]'
                )}
                onClick={() => { setCurrentTask(task.id); setTaskSelectOpen(false); }}
              >
                <p className="font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-[var(--text-muted)] truncate">{task.description}</p>
                )}
              </button>
            ))}

            {(!tasks || tasks.length === 0) && (
              <p className="text-center text-sm text-[var(--text-muted)] py-6">
                No pending tasks. Create some tasks first!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Timer Settings
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="focusDuration" className="text-xs">Focus (min)</Label>
                <Input
                  id="focusDuration"
                  type="number"
                  value={localFocus}
                  onChange={(e) => setLocalFocus(Math.max(1, parseInt(e.target.value) || 25))}
                  min={1}
                  max={120}
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shortBreak" className="text-xs">Short Break (min)</Label>
                <Input
                  id="shortBreak"
                  type="number"
                  value={localShort}
                  onChange={(e) => setLocalShort(Math.max(1, parseInt(e.target.value) || 5))}
                  min={1}
                  max={30}
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="longBreak" className="text-xs">Long Break (min)</Label>
                <Input
                  id="longBreak"
                  type="number"
                  value={localLong}
                  onChange={(e) => setLocalLong(Math.max(1, parseInt(e.target.value) || 15))}
                  min={1}
                  max={60}
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionsUntilLong" className="text-xs">Sessions / Long Break</Label>
                <Input
                  id="sessionsUntilLong"
                  type="number"
                  value={localSessions}
                  onChange={(e) => setLocalSessions(Math.max(1, parseInt(e.target.value) || 4))}
                  min={1}
                  max={10}
                  className="h-8"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Auto-start breaks</p>
                  <p className="text-xs text-[var(--text-muted)]">Begin break timer automatically</p>
                </div>
                <Switch
                  checked={autoStartBreaks}
                  onCheckedChange={setAutoStartBreaks}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Auto-start focus</p>
                  <p className="text-xs text-[var(--text-muted)]">Resume focus after break ends</p>
                </div>
                <Switch
                  checked={autoStartFocus}
                  onCheckedChange={setAutoStartFocus}
                />
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
