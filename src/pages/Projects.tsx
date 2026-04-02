import { useState } from 'react';
import { useTaskStore, useTaskLists, useTasks, useWorkspaces } from '../stores/taskStore';
import { FolderKanban, Plus, Pencil, Trash2, MoreHorizontal, FolderPlus, Palette, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { cn } from '../lib/utils';

const WORKSPACE_COLORS = [
  '#d4a574', '#e07b54', '#c84b31', '#8b5cf6',
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#6366f1', '#ec4899', '#14b8a6', '#84cc16',
];

const ICON_OPTIONS = ['📁', '🏠', '💼', '🎯', '📚', '🎨', '🔧', '💡', '🚀', '⭐', '🌿', '🔬'];

export function Projects() {
  const workspaces = useWorkspaces();
  const taskLists = useTaskLists();
  const allTasks = useTasks();

  const { createWorkspace, updateWorkspace, deleteWorkspace, createTaskList, updateTaskList, deleteTaskList } = useTaskStore();

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description?: string; workspaceId: string } | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceIcon, setWorkspaceIcon] = useState('📁');
  const [workspaceColor, setWorkspaceColor] = useState('#d4a574');

  const getTasksForList = (listId: string) => {
    return allTasks?.filter((t) => t.taskListId === listId) || [];
  };

  const getCompletedCount = (listId: string) => {
    return getTasksForList(listId).filter((t) => t.status === 'completed').length;
  };

  const getProgressPercent = (listId: string) => {
    const tasks = getTasksForList(listId);
    if (tasks.length === 0) return 0;
    return Math.round((getCompletedCount(listId) / tasks.length) * 100);
  };

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const openProjectModal = (project?: typeof editingProject, workspaceId?: string) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectDescription(project.description || '');
      setSelectedWorkspaceId(project.workspaceId);
    } else {
      setEditingProject(null);
      setProjectName('');
      setProjectDescription('');
      setSelectedWorkspaceId(workspaceId || workspaces?.[0]?.id || '');
    }
    setProjectModalOpen(true);
  };

  const openWorkspaceModal = (workspace?: typeof editingWorkspace) => {
    if (workspace) {
      setEditingWorkspace(workspace);
      setWorkspaceName(workspace.name);
      setWorkspaceIcon(workspace.icon);
      setWorkspaceColor(workspace.color);
    } else {
      setEditingWorkspace(null);
      setWorkspaceName('');
      setWorkspaceIcon('📁');
      setWorkspaceColor('#d4a574');
    }
    setWorkspaceModalOpen(true);
  };

  const handleProjectSubmit = async () => {
    if (!projectName.trim() || !selectedWorkspaceId) return;
    if (editingProject) {
      await updateTaskList(editingProject.id, {
        name: projectName,
        description: projectDescription || undefined,
      });
    } else {
      await createTaskList(selectedWorkspaceId, projectName, projectDescription || undefined);
    }
    setProjectModalOpen(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
  };

  const handleWorkspaceSubmit = async () => {
    if (!workspaceName.trim()) return;
    if (editingWorkspace) {
      await updateWorkspace(editingWorkspace.id, {
        name: workspaceName,
        icon: workspaceIcon,
        color: workspaceColor,
      });
    } else {
      await createWorkspace(workspaceName, workspaceIcon, workspaceColor);
    }
    setWorkspaceModalOpen(false);
    setEditingWorkspace(null);
    setWorkspaceName('');
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project and all its tasks?')) {
      await deleteTaskList(id);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (confirm('Delete this workspace and ALL its projects and tasks? This cannot be undone!')) {
      await deleteWorkspace(id);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <FolderKanban className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Projects</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {workspaces?.length || 0} workspace{workspaces?.length !== 1 ? 's' : ''}
              {taskLists?.length ? ` · ${taskLists.length} project${taskLists.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openWorkspaceModal()}
            className="gap-1.5 text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openProjectModal()}
            disabled={!workspaces?.length}
            className="gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </div>

      {/* Workspaces */}
      {workspaces && workspaces.length > 0 ? (
        <div className="space-y-6">
          {workspaces.map((workspace) => {
            const workspaceProjects = taskLists?.filter((tl) => tl.workspaceId === workspace.id) || [];
            const isExpanded = expandedWorkspaces.has(workspace.id);
            const totalTasks = workspaceProjects.reduce((sum, p) => sum + getTasksForList(p.id).length, 0);
            const completedTasks = workspaceProjects.reduce((sum, p) => sum + getCompletedCount(p.id), 0);
            const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div key={workspace.id}>
                {/* Workspace Header */}
                <div
                  className="flex items-center justify-between mb-3 group cursor-pointer"
                  onClick={() => toggleWorkspace(workspace.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: workspace.color + '22', border: `1.5px solid ${workspace.color}44` }}
                    >
                      {workspace.icon}
                    </div>
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">{workspace.name}</span>
                      <span className="ml-2 text-xs text-[var(--text-muted)]">
                        {workspaceProjects.length} project{workspaceProjects.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {totalTasks > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {completedTasks}/{totalTasks} tasks
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {totalTasks > 0 && (
                      <div className="hidden sm:flex items-center gap-2 mr-2">
                        <div className="w-24">
                          <Progress value={overallProgress} className="h-1.5" />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] w-8 text-right">{overallProgress}%</span>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => openProjectModal(undefined, workspace.id)}
                          className="gap-2 text-[var(--text-primary)]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openWorkspaceModal({ id: workspace.id, name: workspace.name, icon: workspace.icon, color: workspace.color })}
                          className="gap-2 text-[var(--text-primary)]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="gap-2 text-[var(--danger)] focus:text-[var(--danger)] focus:bg-[var(--danger)]/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Project Cards Grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-7">
                    {workspaceProjects.map((project) => {
                      const taskCount = getTasksForList(project.id).length;
                      const completedCount = getCompletedCount(project.id);
                      const progress = getProgressPercent(project.id);
                      const isComplete = taskCount > 0 && completedCount === taskCount;

                      return (
                        <Card
                          key={project.id}
                          className="group relative bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-150 hover:shadow-sm"
                        >
                          <CardHeader className="pb-2 pt-4 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: workspace.color + '22' }}
                                >
                                  <span className="text-sm">{workspace.icon}</span>
                                </div>
                                <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                                  {project.name}
                                </span>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem
                                    onClick={() => openProjectModal({ id: project.id, name: project.name, description: project.description, workspaceId: project.workspaceId })}
                                    className="gap-2 text-[var(--text-primary)]"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="gap-2 text-[var(--danger)] focus:text-[var(--danger)] focus:bg-[var(--danger)]/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>

                          <CardContent className="px-4 pb-4 space-y-3">
                            {project.description && (
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                                {project.description}
                              </p>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-muted)]">
                                  {taskCount === 0 ? 'No tasks yet' : `${completedCount} of ${taskCount} done`}
                                </span>
                                {taskCount > 0 && (
                                  <span className={cn(
                                    'text-xs font-medium',
                                    isComplete ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'
                                  )}>
                                    {progress}%
                                  </span>
                                )}
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                              {isComplete && taskCount > 0 ? (
                                <Badge variant="success" className="text-xs">
                                  Complete
                                </Badge>
                              ) : taskCount > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {taskCount - completedCount} remaining
                                </Badge>
                              ) : (
                                <span className="text-xs text-[var(--text-muted)]" />
                              )}
                              <a
                                href={`/tasks?list=${project.id}`}
                                className="text-xs text-[var(--accent-primary)] hover:underline font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Open →
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Add Project Card */}
                    <button
                      onClick={() => openProjectModal(undefined, workspace.id)}
                      className={cn(
                        'min-h-[140px] rounded-lg border-2 border-dashed border-[var(--border-subtle)]',
                        'flex flex-col items-center justify-center gap-2',
                        'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
                        'hover:border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]/50',
                        'transition-all duration-150 cursor-pointer'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">New Project</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">No workspaces yet</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">
            Create your first workspace to start organizing your projects and tasks.
          </p>
          <Button
            onClick={() => openWorkspaceModal()}
            className="gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)]"
          >
            <FolderPlus className="w-4 h-4" />
            Create Workspace
          </Button>
        </div>
      )}

      {/* Project Dialog */}
      <Dialog open={isProjectModalOpen} onOpenChange={(open) => { if (!open) setProjectModalOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-name" className="text-[var(--text-secondary)]">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Marketing Tasks"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                className="bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-desc" className="text-[var(--text-secondary)]">Description (optional)</Label>
              <Input
                id="project-desc"
                placeholder="What is this project for?"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>
            {!editingProject && workspaces && workspaces.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-[var(--text-secondary)]">Workspace</Label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--border-default)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.icon} {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setProjectModalOpen(false)}
              className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProjectSubmit}
              disabled={!projectName.trim()}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)]"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workspace Dialog */}
      <Dialog open={isWorkspaceModalOpen} onOpenChange={(open) => { if (!open) setWorkspaceModalOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWorkspace ? 'Edit Workspace' : 'New Workspace'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="workspace-name" className="text-[var(--text-secondary)]">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Personal, Work, Side Projects"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                autoFocus
                className="bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <span>Icon</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setWorkspaceIcon(icon)}
                    className={cn(
                      'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                      workspaceIcon === icon
                        ? 'bg-[var(--accent-primary)]/20 ring-2 ring-[var(--accent-primary)] scale-110'
                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] hover:scale-105'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Color</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {WORKSPACE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setWorkspaceColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all hover:scale-110',
                      workspaceColor === color ? 'ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110' : ''
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div
                  className="w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: workspaceColor }}
                />
                <span className="text-xs text-[var(--text-muted)] font-mono">{workspaceColor}</span>
                <input
                  type="color"
                  value={workspaceColor}
                  onChange={(e) => setWorkspaceColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]/50 p-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: workspaceColor + '33', border: `1.5px solid ${workspaceColor}55` }}
              >
                {workspaceIcon}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {workspaceName || 'Workspace Name'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Preview</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setWorkspaceModalOpen(false)}
              className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWorkspaceSubmit}
              disabled={!workspaceName.trim()}
              className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--text-on-accent)]"
            >
              {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
