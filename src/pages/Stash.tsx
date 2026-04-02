import { useState } from 'react';
import {
  useStashStore,
  useStashItems,
  useProcessedStashItems,
  useUnprocessedStashCount,
} from '../stores/stashStore';
import { useTaskLists, useTaskStore } from '../stores/taskStore';
import { Modal } from '../components/common/Modal';
import { Textarea } from '../components/common/Input';
import { formatDistanceToNow, format } from 'date-fns';
import {
  analyzeBrainDump,
  getPriorityEmoji,
  getPriorityLabel,
  type ExtractedTask,
  type AnalysisResult,
} from '../utils/brainDumpAnalyzer';
import { toast } from '../stores/toastStore';

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
  const [showProcessed, setShowProcessed] = useState(false);

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

    // Simulate brief analysis time for UX
    setTimeout(() => {
      const result = analyzeBrainDump(content);
      setAnalysisResult(result);
      setSelectedTasks(new Set(result.tasks.map((_, i) => i))); // Select all by default
      setSelectedTaskListId(taskLists?.[0]?.id || '');
      setIsAnalyzing(false);
    }, 500);
  };

  const toggleTaskSelection = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const selectAllTasks = () => {
    if (analysisResult) {
      setSelectedTasks(new Set(analysisResult.tasks.map((_, i) => i)));
    }
  };

  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

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

    // Mark the original item as processed
    if (analyzingItemId) {
      await markAsProcessed(analyzingItemId);
    }

    // Close the modal
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl">Brain Dump</h2>
          <p className="text-muted text-sm">
            Dump your thoughts, then let me analyze and organize them into tasks!
          </p>
        </div>
        <button className="btn btn-primary" onClick={openQuickStash}>
          + Quick Stash
        </button>
      </div>

      {/* Quick Add Inline */}
      <div className="card mb-6">
        <div className="card-body">
          <Textarea
            placeholder="Dump everything on your mind here... tasks, ideas, reminders, random thoughts. I'll help you sort it out!

Example:
- Call mom tomorrow
- Need to finish the report by Friday urgent
- Buy groceries: milk, eggs, bread
- Maybe learn guitar someday
- Email John about the project"
            value={newContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewContent(e.target.value)}
            rows={5}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted">Press Ctrl+Enter to save</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={!newContent.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Stash It'}
            </button>
          </div>
        </div>
      </div>

      {/* Unprocessed Items */}
      <section className="mb-8">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <span>📥</span>
          Inbox
          <span className="text-muted text-sm">({unprocessedCount || 0})</span>
        </h3>

        {unprocessedItems && unprocessedItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {unprocessedItems.map((item) => (
              <div key={item.id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{item.content}</p>
                      <div className="text-xs text-muted mt-2">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="btn btn-nut btn-sm"
                        onClick={() => handleAnalyze(item.id, item.content)}
                        title="Analyze & Create Tasks"
                        disabled={isAnalyzing}
                      >
                        🧠 Analyze
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => markAsProcessed(item.id)}
                        title="Mark as processed"
                      >
                        ✓
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => deleteStashItem(item.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center p-8">
              <div className="text-4xl mb-4">🧠</div>
              <p className="text-muted mb-4">
                Your brain dump inbox is empty! Use the form above to dump your thoughts, then I'll help you analyze and organize them into tasks.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Processed Items */}
      <section>
        <button
          className="text-lg mb-4 flex items-center gap-2 cursor-pointer hover:text-muted transition-colors"
          onClick={() => setShowProcessed(!showProcessed)}
        >
          <span>{showProcessed ? '▼' : '▶'}</span>
          <span>✅</span>
          Processed
          <span className="text-muted text-sm">({processedItems?.length || 0})</span>
        </button>

        {showProcessed && (
          <>
            {processedItems && processedItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {processedItems.map((item) => (
                  <div key={item.id} className="card bg-muted opacity-75">
                    <div className="card-body py-2 px-4">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted truncate">
                            {item.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          {item.convertedToTaskId && (
                            <span className="text-success">Converted to task</span>
                          )}
                          <button
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => deleteStashItem(item.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center p-6">
                  <p className="text-muted text-sm">
                    Processed items will appear here
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Quick Stash Modal */}
      <Modal
        isOpen={isQuickStashOpen}
        onClose={closeQuickStash}
        title="Quick Brain Dump"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="What's on your mind? Just dump it here..."
            value={newContent}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewContent(e.target.value)}
            rows={5}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost" onClick={closeQuickStash}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!newContent.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Stash It'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Analysis Results Modal */}
      <Modal
        isOpen={!!analysisResult}
        onClose={closeAnalysisModal}
        title="Brain Dump Analysis"
        size="lg"
      >
        {analysisResult && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="card bg-accent">
              <div className="card-body p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <span className="font-medium">{analysisResult.summary}</span>
                </div>
              </div>
            </div>

            {/* Tasks Found */}
            {analysisResult.tasks.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Extracted Tasks</h4>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={selectAllTasks}
                    >
                      Select All
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={deselectAllTasks}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
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

            {/* Notes (non-tasks) */}
            {analysisResult.notes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-muted">
                  Notes (not actionable):
                </h4>
                <div className="text-sm text-muted space-y-1">
                  {analysisResult.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Selection */}
            {analysisResult.tasks.length > 0 && (
              <div>
                <label className="input-label">Create tasks in:</label>
                <select
                  className="select"
                  value={selectedTaskListId}
                  onChange={(e) => setSelectedTaskListId(e.target.value)}
                >
                  {taskLists?.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(!taskLists || taskLists.length === 0) && (
              <p className="text-warning text-sm">
                You need to create a project first before creating tasks.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn btn-ghost" onClick={closeAnalysisModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSelectedTasks}
                disabled={selectedTasks.size === 0 || !selectedTaskListId}
              >
                Create {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Loading Modal */}
      <Modal isOpen={isAnalyzing} onClose={() => {}} title="" size="sm">
        <div className="text-center p-4">
          <div className="text-4xl mb-4 animate-bounce">🧠</div>
          <p className="font-medium">Analyzing your brain dump...</p>
          <p className="text-sm text-muted">Extracting tasks and organizing thoughts</p>
        </div>
      </Modal>
    </div>
  );
}

// Task Preview Card Component
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
      className={`card cursor-pointer transition-colors ${selected ? 'bg-accent' : 'hover:bg-hover'}`}
      onClick={onToggle}
      style={{
        borderColor: selected ? 'var(--accent-primary)' : undefined,
        borderWidth: selected ? '2px' : undefined,
      }}
      title={task.originalText ? `Original: "${task.originalText}"` : undefined}
    >
      <div className="card-body p-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="checkbox mt-1"
            checked={selected}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{task.title}</span>
              <span className="text-sm" title={getPriorityLabel(task.priority)}>
                {getPriorityEmoji(task.priority)}
              </span>
              {task.category && (
                <span className="badge text-xs">{task.category}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
              <span>{getPriorityLabel(task.priority)}</span>
              {task.dueDate && (
                <span>Due: {format(task.dueDate, 'MMM d')}</span>
              )}
              {task.tags.length > 0 && (
                <span>#{task.tags.join(' #')}</span>
              )}
            </div>
            {task.originalText && task.originalText !== task.title && (
              <div className="text-xs text-muted mt-1 opacity-60 italic truncate">
                "{task.originalText}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
