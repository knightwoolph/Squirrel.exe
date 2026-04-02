import { useEffect, useRef, useState } from 'react';
import { useTimerStore, useTodaysSessions, type TimerMode } from '../stores/timerStore';
import { useTasks } from '../stores/taskStore';
import { Modal } from '../components/common/Modal';

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
  const tasks = useTasks(undefined, false); // Only pending tasks
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isTaskSelectOpen, setTaskSelectOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Timer tick effect
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  // Update page title with timer
  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'short-break' ? 'Break' : 'Long Break';
    document.title = isRunning ? `${timeString} - ${modeLabel} | SQRL` : 'Timer | SQRL';

    return () => {
      document.title = 'SQRL';
    };
  }, [timeRemaining, mode, isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeLabel = (m: TimerMode) => {
    switch (m) {
      case 'focus':
        return 'Focus';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
    }
  };

  const getModeColor = (m: TimerMode) => {
    switch (m) {
      case 'focus':
        return 'var(--accent-primary)';
      case 'short-break':
        return 'var(--color-success)';
      case 'long-break':
        return 'var(--color-info)';
    }
  };

  const getModeEmoji = (m: TimerMode) => {
    switch (m) {
      case 'focus':
        return '🎯';
      case 'short-break':
        return '☕';
      case 'long-break':
        return '🌳';
    }
  };

  const getProgressPercent = () => {
    let totalSeconds: number;
    switch (mode) {
      case 'focus':
        totalSeconds = focusDuration * 60;
        break;
      case 'short-break':
        totalSeconds = shortBreakDuration * 60;
        break;
      case 'long-break':
        totalSeconds = longBreakDuration * 60;
        break;
    }
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };

  const currentTask = tasks?.find((t) => t.id === currentTaskId);

  return (
    <div className="p-4 flex flex-col items-center">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-8">
        {(['focus', 'short-break', 'long-break'] as TimerMode[]).map((m) => (
          <button
            key={m}
            className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode(m)}
            disabled={isRunning}
          >
            {getModeEmoji(m)} {getModeLabel(m)}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div
        className="timer-display mb-8"
        style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Progress Ring */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)',
          }}
          width="300"
          height="300"
        >
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="8"
          />
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke={getModeColor(mode)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 140}
            strokeDashoffset={2 * Math.PI * 140 * (1 - getProgressPercent() / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Time Display */}
        <div className="text-5xl font-bold mb-2" style={{ zIndex: 1 }}>
          {formatTime(timeRemaining)}
        </div>
        <div className="text-lg text-muted" style={{ zIndex: 1 }}>
          {getModeEmoji(mode)} {getModeLabel(mode)}
        </div>
      </div>

      {/* Current Task Display */}
      {currentTask && (
        <div className="card mb-4 p-3" style={{ maxWidth: '300px' }}>
          <div className="text-sm text-muted mb-1">Working on:</div>
          <div className="font-medium truncate">{currentTask.title}</div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3 mb-8">
        {!isRunning && !isPaused && (
          <button className="btn btn-primary btn-lg" onClick={start}>
            ▶ Start
          </button>
        )}
        {isRunning && (
          <button className="btn btn-secondary btn-lg" onClick={pause}>
            ⏸ Pause
          </button>
        )}
        {isPaused && (
          <>
            <button className="btn btn-primary btn-lg" onClick={resume}>
              ▶ Resume
            </button>
            <button className="btn btn-ghost btn-lg" onClick={reset}>
              ↺ Reset
            </button>
          </>
        )}
        <button
          className="btn btn-ghost"
          onClick={skip}
          title="Skip to next phase"
        >
          ⏭ Skip
        </button>
      </div>

      {/* Session Info & Actions */}
      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        <button
          className="card p-3 text-center cursor-pointer hover:bg-hover transition-colors"
          onClick={() => setTaskSelectOpen(true)}
          style={{ minWidth: '120px' }}
        >
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm text-muted">
            {currentTask ? 'Change Task' : 'Select Task'}
          </div>
        </button>

        <div className="card p-3 text-center" style={{ minWidth: '120px' }}>
          <div className="text-2xl font-bold">{sessionsCompleted}</div>
          <div className="text-sm text-muted">Sessions Today</div>
        </div>

        <div className="card p-3 text-center" style={{ minWidth: '120px' }}>
          <div className="text-2xl font-bold">{todaysSessions?.totalMinutes || 0}</div>
          <div className="text-sm text-muted">Minutes Focused</div>
        </div>

        <button
          className="card p-3 text-center cursor-pointer hover:bg-hover transition-colors"
          onClick={() => setSettingsOpen(true)}
          style={{ minWidth: '120px' }}
        >
          <div className="text-2xl mb-1">⚙️</div>
          <div className="text-sm text-muted">Settings</div>
        </button>
      </div>

      {/* Sessions Progress */}
      <div className="card p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-sm text-muted mb-2">
          Progress to long break ({sessionsUntilLongBreak} sessions)
        </div>
        <div className="flex gap-2">
          {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background:
                  i < (sessionsCompleted % sessionsUntilLongBreak)
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Task Selection Modal */}
      <Modal
        isOpen={isTaskSelectOpen}
        onClose={() => setTaskSelectOpen(false)}
        title="Select Task to Focus On"
        size="sm"
      >
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          <button
            className={`p-3 rounded text-left hover:bg-hover transition-colors ${!currentTaskId ? 'bg-accent' : ''}`}
            onClick={() => {
              setCurrentTask(null);
              setTaskSelectOpen(false);
            }}
          >
            <div className="font-medium">No specific task</div>
            <div className="text-sm text-muted">Just focus on anything</div>
          </button>

          {tasks?.map((task) => (
            <button
              key={task.id}
              className={`p-3 rounded text-left hover:bg-hover transition-colors ${currentTaskId === task.id ? 'bg-accent' : ''}`}
              onClick={() => {
                setCurrentTask(task.id);
                setTaskSelectOpen(false);
              }}
            >
              <div className="font-medium">{task.title}</div>
              {task.description && (
                <div className="text-sm text-muted truncate">{task.description}</div>
              )}
            </button>
          ))}

          {(!tasks || tasks.length === 0) && (
            <div className="text-center text-muted p-4">
              No pending tasks. Create some tasks first!
            </div>
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Timer Settings"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="input-label">Focus Duration (minutes)</label>
            <input
              type="number"
              className="input"
              value={focusDuration}
              onChange={(e) => setFocusDuration(Math.max(1, parseInt(e.target.value) || 25))}
              min={1}
              max={120}
            />
          </div>

          <div>
            <label className="input-label">Short Break (minutes)</label>
            <input
              type="number"
              className="input"
              value={shortBreakDuration}
              onChange={(e) => setShortBreakDuration(Math.max(1, parseInt(e.target.value) || 5))}
              min={1}
              max={30}
            />
          </div>

          <div>
            <label className="input-label">Long Break (minutes)</label>
            <input
              type="number"
              className="input"
              value={longBreakDuration}
              onChange={(e) => setLongBreakDuration(Math.max(1, parseInt(e.target.value) || 15))}
              min={1}
              max={60}
            />
          </div>

          <div>
            <label className="input-label">Sessions until Long Break</label>
            <input
              type="number"
              className="input"
              value={sessionsUntilLongBreak}
              onChange={(e) => setSessionsUntilLongBreak(Math.max(1, parseInt(e.target.value) || 4))}
              min={1}
              max={10}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoStartBreaks"
              className="checkbox"
              checked={autoStartBreaks}
              onChange={(e) => setAutoStartBreaks(e.target.checked)}
            />
            <label htmlFor="autoStartBreaks">Auto-start breaks</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoStartFocus"
              className="checkbox"
              checked={autoStartFocus}
              onChange={(e) => setAutoStartFocus(e.target.checked)}
            />
            <label htmlFor="autoStartFocus">Auto-start focus after break</label>
          </div>

          <button
            className="btn btn-primary mt-2"
            onClick={() => setSettingsOpen(false)}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
