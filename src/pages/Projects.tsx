import { useState } from 'react';
import { useTaskStore, useTaskLists, useTasks, useWorkspaces } from '../stores/taskStore';
import { Modal } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/Input';

export function Projects() {
  const workspaces = useWorkspaces();
  const taskLists = useTaskLists();
  const allTasks = useTasks();

  const { createWorkspace, updateWorkspace, deleteWorkspace, createTaskList, updateTaskList, deleteTaskList } = useTaskStore();

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description?: string; workspaceId: string } | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceIcon, setWorkspaceIcon] = useState('📁');
  const [workspaceColor, setWorkspaceColor] = useState('#d4a574');

  const iconOptions = ['📁', '🏠', '💼', '🎯', '📚', '🎨', '🔧', '💡', '🚀', '⭐'];

  const getTasksForList = (listId: string) => {
    return allTasks?.filter((t) => t.taskListId === listId) || [];
  };

  const getCompletedCount = (listId: string) => {
    const tasks = getTasksForList(listId);
    return tasks.filter((t) => t.status === 'completed').length;
  };

  const getProgressPercent = (listId: string) => {
    const tasks = getTasksForList(listId);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl">Projects</h2>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => openWorkspaceModal()}>
            + Workspace
          </button>
          <button className="btn btn-primary" onClick={() => openProjectModal()}>
            + New Project
          </button>
        </div>
      </div>

      {/* Workspaces with their projects */}
      {workspaces && workspaces.length > 0 ? (
        workspaces.map((workspace) => {
          const workspaceProjects = taskLists?.filter((tl) => tl.workspaceId === workspace.id) || [];

          return (
            <section key={workspace.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{workspace.icon}</span>
                  <h3 className="text-lg font-medium">{workspace.name}</h3>
                  <span className="text-muted text-sm">({workspaceProjects.length} projects)</span>
                </div>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => openWorkspaceModal({
                      id: workspace.id,
                      name: workspace.name,
                      icon: workspace.icon,
                      color: workspace.color,
                    })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {workspaceProjects.map((project) => {
                  const taskCount = getTasksForList(project.id).length;
                  const completedCount = getCompletedCount(project.id);
                  const progress = getProgressPercent(project.id);

                  return (
                    <div key={project.id} className="project-card">
                      <div className="flex justify-between items-start mb-2">
                        <div className="project-card-icon">📋</div>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => openProjectModal({
                              id: project.id,
                              name: project.name,
                              description: project.description,
                              workspaceId: project.workspaceId,
                            })}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="project-card-name">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-muted mb-2 line-clamp-2">{project.description}</div>
                      )}
                      <div className="project-card-stats">
                        {completedCount}/{taskCount} tasks completed
                      </div>
                      <div className="project-card-progress" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
                        <div className="project-card-progress-bar"></div>
                      </div>
                      <a
                        href={`/tasks?list=${project.id}`}
                        className="btn btn-ghost btn-sm w-full mt-2"
                      >
                        View Tasks
                      </a>
                    </div>
                  );
                })}

                {/* Add Project Card */}
                <button
                  onClick={() => openProjectModal(undefined, workspace.id)}
                  className="card cursor-pointer hover:bg-hover transition-colors"
                  style={{
                    border: '2px dashed var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '150px',
                    background: 'transparent',
                  }}
                >
                  <div className="text-center text-muted">
                    <div className="text-2xl mb-2">+</div>
                    <div>New Project</div>
                  </div>
                </button>
              </div>
            </section>
          );
        })
      ) : (
        <div className="card">
          <div className="card-body text-center p-8">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-muted mb-4">
              No workspaces yet. Create your first workspace to organize your projects!
            </p>
            <button className="btn btn-primary" onClick={() => openWorkspaceModal()}>
              Create Workspace
            </button>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Project Name"
            placeholder="e.g., Marketing Tasks"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            autoFocus
          />

          <Textarea
            label="Description (optional)"
            placeholder="What is this project for?"
            value={projectDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectDescription(e.target.value)}
            rows={2}
          />

          {!editingProject && workspaces && workspaces.length > 1 && (
            <div>
              <label className="input-label">Workspace</label>
              <select
                className="select"
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.icon} {ws.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button className="btn btn-ghost" onClick={() => setProjectModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleProjectSubmit}
              disabled={!projectName.trim()}
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Workspace Modal */}
      <Modal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        title={editingWorkspace ? 'Edit Workspace' : 'New Workspace'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Workspace Name"
            placeholder="e.g., Personal, Work, Side Projects"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            autoFocus
          />

          <div>
            <label className="input-label">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`p-2 rounded text-xl ${workspaceIcon === icon ? 'bg-accent' : 'hover:bg-hover'}`}
                  onClick={() => setWorkspaceIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Color</label>
            <input
              type="color"
              value={workspaceColor}
              onChange={(e) => setWorkspaceColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button className="btn btn-ghost" onClick={() => setWorkspaceModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleWorkspaceSubmit}
              disabled={!workspaceName.trim()}
            >
              {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
