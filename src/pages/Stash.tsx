import { useState } from 'react';
import {
  useStashStore,
  useStashItems,
  useProcessedStashItems,
  useUnprocessedStashCount,
} from '../stores/stashStore';
import { useTaskLists, useTaskStore } from '../stores/taskStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Brain,
  Sparkles,
  Zap,
  Check,
  X,
  Target,
  Calendar,
  Tag,
  Wand2,
  Loader2,
  Inbox,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  analyzeBrainDump,
  getPriorityEmoji,
  getPriorityLabel,
  type ExtractedTask,
  type AnalysisResult,
} from '../utils/brainDumpAnalyzer';
import { toast } from '../stores/toastStore';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-500/15 text-red-600 border-red-200',
  2: 'bg-orange-500/15 text-orange-600 border-orange-200',
  3: 'bg-yellow-500/15 text-yellow-600 border-yellow-200',
  4: 'bg-blue-500/15 text-blue-600 border-blue-200',
  5: 'bg-slate-500/15 text-slate-600 border-slate-200',
};

const CONFIDENCE_COLOR = (c: number) => {
  if (c >= 0.8) return 'bg-emerald-500';
  if (c >= 0.5) return 'bg-yellow-500';
  return 'bg-slate-400';
};

export function Stash() {
  const {
    isQuickStashOpen,
    openQuickStash,
    closeQuickStash,
    addStashItem,
    deleteStashItem,
    markAsProcessed,
  } = useStashStore();

  const { createTask } = useTaskStore();

  const unprocessedItems = useStashItems(false);
  const processedItems = useProcessedStashItems(20);
  const unprocessedCount = useUnprocessedStashCount();
  const taskLists = useTaskLists();

  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addStashItem(newContent.trim());
    setNewContent('');
    setIsSubmitting(false);
    closeQuickStash();
  };

  const handleAnalyze = (itemId: string, content: string) => {
    setIsAnalyzing(true);
    setAnalyzingItemId(itemId);
    setTimeout(() => {
      const result = analyzeBrainDump(content);
      setAnalysisResult(result);
      setSelectedTasks(new Set(result.tasks.map((_, i) => i)));
      setSelectedTaskListId(taskLists?.[0]?.id || '');
      setIsAnalyzing(false);
    }, 600);
  };

  const toggleTaskSelection = (index: number) => {
    const next = new Set(selectedTasks);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedTasks(next);
  };

  const selectAllTasks = () => {
    if (analysisResult) setSelectedTasks(new Set(analysisResult.tasks.map((_, i) => i)));
  };

  const deselectAllTasks = () => setSelectedTasks(new Set());

  const handleCreateSelectedTasks = async () => {
    if (!analysisResult || !selectedTaskListId || selectedTasks.size === 0) return;

    const tasksToCreate = analysisResult.tasks.filter((_, i) => selectedTasks.has(i));

    for (const task of tasksToCreate) {
      await createTask({
        taskListId: selectedTaskListId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
      });
    }

    toast.success(
      `Created ${tasksToCreate.length} task${tasksToCreate.length !== 1 ? 's' : ''}!`,
      'Your brain dump has been organized'
    );

    if (analyzingItemId) await markAsProcessed(analyzingItemId);

    setAnalysisResult(null);
    setAnalyzingItemId(null);
    setSelectedTasks(new Set());
  };

  const closeAnalysisModal = () => {
    setAnalysisResult(null);
    setAnalyzingItemId(null);
    setSelectedTasks(new Set());
  };

  return (
    <div className="p-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--accent-primary)]" />
            Brain Dump
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Dump your thoughts, then let AI organize them into tasks.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openQuickStash}>
          <Zap className="h-3.5 w-3.5" />
          Quick Stash
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="capture">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="capture" className="flex-1 gap-1.5">
            <Inbox className="h-3.5 w-3.5" />
            Inbox
            {(unprocessedCount ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                {unprocessedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Processed
            {(processedItems?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">
                {processedItems?.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Capture Tab */}
        <TabsContent value="capture" className="space-y-4">
          {/* Inline capture */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
                What's on your mind?
              </CardTitle>
              <CardDescription className="text-xs">
                Write tasks, ideas, reminders — anything. I'll analyze and extract actionable items.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                placeholder={`Example:\n- Call mom tomorrow\n- Finish report by Friday urgent\n- Buy groceries: milk, eggs\n- Maybe learn guitar someday`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                className="resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[var(--text-muted)]">
                  Ctrl+Enter to save
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newContent.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Stash It
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inbox items */}
          {unprocessedItems && unprocessedItems.length > 0 ? (
            <div className="space-y-3">
              {unprocessedItems.map((item) => (
                <Card key={item.id} className="group">
                  <CardContent className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap text-[var(--text-primary)] break-words">
                          {item.content}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1.5">
                          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyze(item.id, item.content)}
                          disabled={isAnalyzing}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <Wand2 className="h-3 w-3" />
                          Analyze
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => markAsProcessed(item.id)}
                          title="Mark as processed"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteStashItem(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
                  Your inbox is empty. Use the form above to dump your thoughts — I'll help organize them.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-2">
          {processedItems && processedItems.length > 0 ? (
            processedItems.map((item) => (
              <Card key={item.id} className="opacity-60 hover:opacity-80 transition-opacity">
                <CardContent className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-muted)] truncate line-through">
                        {item.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.convertedToTaskId && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Converted
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => deleteStashItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  Processed items will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stash Dialog */}
      <Dialog open={isQuickStashOpen} onOpenChange={(o) => !o && closeQuickStash()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--accent-primary)]" />
              Quick Brain Dump
            </DialogTitle>
            <DialogDescription>
              What's on your mind? Just dump it here.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What's on your mind?…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={5}
            autoFocus
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={closeQuickStash}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!newContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Zap className="h-3.5 w-3.5" /> Stash It</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis Loading Dialog */}
      <Dialog open={isAnalyzing} onOpenChange={() => {}}>
        <DialogContent className="max-w-xs text-center">
          <div className="py-4 flex flex-col items-center gap-3">
            <div className="relative">
              <Brain className="h-10 w-10 text-[var(--accent-primary)]" />
              <Loader2 className="h-5 w-5 animate-spin absolute -top-1 -right-1 text-[var(--accent-primary)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">Analyzing your brain dump…</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Extracting tasks and organizing thoughts</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis Results Dialog */}
      <Dialog open={!!analysisResult} onOpenChange={(o) => !o && closeAnalysisModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-primary)]" />
              Brain Dump Analysis
            </DialogTitle>
            {analysisResult && (
              <DialogDescription>{analysisResult.summary}</DialogDescription>
            )}
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-5">
              {/* Tasks */}
              {analysisResult.tasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Extracted Tasks
                      <Badge variant="secondary" className="ml-2">
                        {analysisResult.tasks.length}
                      </Badge>
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={selectAllTasks}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={deselectAllTasks}
                      >
                        None
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {analysisResult.tasks.map((task, index) => (
                      <TaskPreviewCard
                        key={index}
                        task={task}
                        selected={selectedTasks.has(index)}
                        onToggle={() => toggleTaskSelection(index)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {analysisResult.notes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                      Non-actionable notes
                    </p>
                    <ul className="space-y-1">
                      {analysisResult.notes.map((note, index) => (
                        <li key={index} className="text-sm text-[var(--text-muted)] flex gap-2">
                          <span className="shrink-0 mt-0.5">•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* List Selector */}
              {analysisResult.tasks.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Create tasks in</Label>
                    {(!taskLists || taskLists.length === 0) ? (
                      <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                        You need to create a project first before creating tasks.
                      </p>
                    ) : (
                      <Select
                        value={selectedTaskListId}
                        onValueChange={setSelectedTaskListId}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select a list…" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </>
              )}

              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={closeAnalysisModal}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSelectedTasks}
                  disabled={selectedTasks.size === 0 || !selectedTaskListId}
                >
                  <Target className="h-3.5 w-3.5" />
                  Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Task Preview Card ──────────────────────────────────────────────────────────

function TaskPreviewCard({
  task,
  selected,
  onToggle,
}: {
  task: ExtractedTask;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border p-3 cursor-pointer transition-all',
        'hover:bg-[var(--bg-tertiary)]',
        selected
          ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)]'
          : 'border-[var(--border-default)] bg-[var(--bg-secondary)]'
      )}
      onClick={onToggle}
      title={task.originalText ? `Original: "${task.originalText}"` : undefined}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--text-primary)] break-words">
              {task.title}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs h-4 px-1.5 shrink-0',
                PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[3]
              )}
            >
              {getPriorityEmoji(task.priority)} {getPriorityLabel(task.priority)}
            </Badge>
            {task.category && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5 gap-0.5 shrink-0">
                <Tag className="h-2.5 w-2.5" />
                {task.category}
              </Badge>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {/* Confidence bar */}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  CONFIDENCE_COLOR(task.confidence)
                )}
              />
              <span className="text-xs text-[var(--text-muted)]">
                {Math.round(task.confidence * 100)}% confidence
              </span>
            </div>

            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Calendar className="h-3 w-3" />
                {format(task.dueDate, 'MMM d')}
              </span>
            )}

            {task.tags.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                #{task.tags.join(' #')}
              </span>
            )}
          </div>

          {/* Original text */}
          {task.originalText && task.originalText !== task.title && (
            <p className="text-xs text-[var(--text-muted)] mt-1 italic opacity-60 truncate">
              "{task.originalText}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
