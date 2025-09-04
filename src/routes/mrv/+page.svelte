<script lang="ts">
    import { goto } from '$app/navigation';
    import { Trees, Plus, FolderOpen, Calendar, User, Trash2, Edit } from '@lucide/svelte';
    import { onMount } from 'svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';
    import { TOTAL_PHASE, PHASE_1_STEPS, PHASE_2_STEPS, PHASE_3_STEPS, PHASE_4_STEPS } from '$lib/config/config';
    
    // Type definitions
    interface Project {
        id: number;
        name: string;
        description: string | null;
        status: string;
        current_phase: number;
        current_step: number;
        created_date: string;
        last_modified: string;
        created_by_username: string | null;
        progress_percentage: number;
        status_display: string;
        phase_display: string;
    }
    
    let showCreateForm = $state(false);
    let projectName = $state('');
    let projectDescription = $state('');
    let loading = $state(false);
    let error = $state('');
    let success = $state('');
    let showDeleteConfirm = $state(false);
    let projectToDelete = $state<Project | null>(null);
    let editingProject = $state<Project | null>(null);
    let editProjectName = $state('');
    
    import { API_ENDPOINTS } from '$lib/config/api';
    
    // Projects data from API
    let existingProjects = $state<Project[]>([]);

    // Progress calculation function
    function calculateProgress(project: Project): { percentage: number; phaseProgress: number; totalSteps: number; currentStep: number } {
        const phaseSteps = [PHASE_1_STEPS, PHASE_2_STEPS, PHASE_3_STEPS, PHASE_4_STEPS];
        
        let completedSteps = 0;
        let totalSteps = 0;
        
        // Calculate completed steps from previous phases
        for (let i = 0; i < project.current_phase - 1; i++) {
            completedSteps += phaseSteps[i];
        }
        
        // Add current phase steps
        completedSteps += project.current_step - 1;
        
        // Calculate total steps
        totalSteps = phaseSteps.reduce((sum, steps) => sum + steps, 0);
        
        // Calculate percentage
        const percentage = Math.round((completedSteps / totalSteps) * 100);
        
        // Calculate current phase progress
        const currentPhaseSteps = phaseSteps[project.current_phase - 1] || 0;
        const phaseProgress = currentPhaseSteps > 0 ? Math.round(((project.current_step - 1) / currentPhaseSteps) * 100) : 0;
        
        return {
            percentage: Math.min(percentage, 100),
            phaseProgress: Math.min(phaseProgress, 100),
            totalSteps,
            currentStep: completedSteps + 1
        };
    }

    // Get phase name for display
    function getPhaseName(phase: number): string {
        const phaseNames = [
            'Data Selection & Validation',
            'Height-Diameter Modelling',
            'Volume Ratio Calculation',
            'Carbon Emission Calculation'
        ];
        return phaseNames[phase - 1] || `Phase ${phase}`;
    }
    
    // API Functions
    async function fetchProjects(): Promise<void> {
        try {
            loading = true;
            error = '';
            const response = await fetch(API_ENDPOINTS.MRV_PROJECTS);
            const data = await response.json();
            
            if (data.success) {
                existingProjects = data.projects;
            } else {
                error = data.error || 'Failed to fetch projects';
            }
        } catch (err) {
            error = 'Network error: Unable to connect to server';
            console.error('Error fetching projects:', err);
        } finally {
            loading = false;
        }
    }
    
    async function createNewProject(): Promise<void> {
        if (!projectName.trim()) {
            error = 'Project name is required';
            return;
        }
        
        // Validate project name format
        const nameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!nameRegex.test(projectName.trim())) {
            error = 'Project name can only contain letters, numbers, underscores (_), and hyphens (-).';
            return;
        }
        
        try {
            loading = true;
            error = '';
            success = '';
            
            const response = await fetch(API_ENDPOINTS.MRV_CREATE_PROJECT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: projectName.trim(),
                    description: projectDescription.trim(),
                    current_step: 1
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                success = 'Project created successfully!';
                // Add new project to the list
                existingProjects = [data.project, ...existingProjects];
                // Reset form
                cancelCreate();
                // Set project in store and navigate to analysis page
                projectStore.set({
                    id: data.project.id.toString(),
                    name: data.project.name
                });
                goto(`/mrv/analysis?project=${data.project.id}&name=${encodeURIComponent(data.project.name)}`);
            } else {
                error = data.error || 'Failed to create project';
            }
        } catch (err) {
            error = 'Network error: Unable to connect to server';
            console.error('Error creating project:', err);
        } finally {
            loading = false;
        }
    }
    
    async function selectProject(project: Project): Promise<void> {
        try {
            // Set project in store
            projectStore.set({
                id: project.id.toString(),
                name: project.name
            });
            
            // Navigate directly to the correct phase and step based on project progress
            let targetUrl = '';
            
            // Route based on current phase
            switch (project.current_phase) {
                case 1: // Data Collection Phase
                    if (project.current_step >= 2) {
                        // If step 2 or higher, go to data-selection
                        targetUrl = `/mrv/analysis/data-selection?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    } else {
                        // If step 1, go to analysis overview
                        targetUrl = `/mrv/analysis?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    }
                    break;
                    
                case 2: // Height-Diameter Modeling Phase
                    targetUrl = `/mrv/analysis/hd-model?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    break;
                    
                case 3: // Volume Calculation Phase
                    targetUrl = `/mrv/analysis/vol-calc?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    break;
                    
                case 4: // Carbon Calculation Phase
                    targetUrl = `/mrv/analysis/carbon-calc?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    break;
                    
                default:
                    // Fallback to analysis overview
                    targetUrl = `/mrv/analysis?project=${project.id}&name=${encodeURIComponent(project.name)}`;
                    break;
            }
            
            goto(targetUrl);
        } catch (err) {
            error = 'Error selecting project';
            console.error('Error selecting project:', err);
        }
    }
    
    function showDeleteConfirmation(project: Project, event: Event): void {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Prevent triggering selectProject
        projectToDelete = project;
        showDeleteConfirm = true;
    }
    
    async function confirmDeleteProject(): Promise<void> {
        if (!projectToDelete) return;
        
        try {
            loading = true;
            error = '';
            
            const response = await fetch(API_ENDPOINTS.MRV_DELETE_PROJECT(projectToDelete.id), {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove project from the list
                existingProjects = existingProjects.filter(p => p.id !== projectToDelete!.id);
                success = 'Project deleted successfully!';
            } else {
                error = data.error || 'Failed to delete project';
            }
        } catch (err) {
            error = 'Network error: Unable to connect to server';
            console.error('Error deleting project:', err);
        } finally {
            loading = false;
            projectToDelete = null;
        }
    }
    
    async function startEditProject(project: Project, event: Event): Promise<void> {
        event.preventDefault(); // Prevent default behavior
        event.stopPropagation(); // Prevent event bubbling
        editingProject = project;
        editProjectName = project.name;
    }
    
    async function saveEditProject(): Promise<void> {
        if (!editingProject || !editProjectName.trim()) {
            error = 'Project name is required';
            return;
        }
        
        // Validate project name format
        const nameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!nameRegex.test(editProjectName.trim())) {
            error = 'Project name can only contain letters, numbers, underscores (_), and hyphens (-).';
            return;
        }
        
        // Check if name already exists (excluding current project)
        if (existingProjects.some(p => p.id !== editingProject!.id && p.name === editProjectName.trim())) {
            error = 'Project with this name already exists';
            return;
        }
        
        try {
            loading = true;
            error = '';
            
            const response = await fetch(API_ENDPOINTS.MRV_UPDATE_PROJECT(editingProject!.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editProjectName.trim()
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update project in the list
                existingProjects = existingProjects.map(p => 
                    p.id === editingProject!.id 
                        ? { ...p, name: editProjectName.trim() }
                        : p
                );
                
                // Update project store if this is the current project
                const currentProject = $projectStore;
                if (currentProject.id === editingProject!.id.toString()) {
                    projectStore.set({
                        ...currentProject,
                        name: editProjectName.trim()
                    });
                }
                
                success = 'Project name updated successfully!';
                cancelEditProject();
            } else {
                error = data.error || 'Failed to update project name';
            }
        } catch (err) {
            error = 'Network error: Unable to connect to server';
            console.error('Error updating project:', err);
        } finally {
            loading = false;
        }
    }
    
    function cancelEditProject(): void {
        editingProject = null;
        editProjectName = '';
    }
    
    function cancelDeleteProject(): void {
        projectToDelete = null;
    }
    
    function cancelCreate(): void {
        showCreateForm = false;
        projectName = '';
        projectDescription = '';
        error = '';
        success = '';
    }
    
    function clearMessages(): void {
        error = '';
        success = '';
    }
    
    // Load projects on component mount
    onMount(() => {
        fetchProjects();
    });
    
    // Clear messages after 5 seconds
    $effect(() => {
        if (success || error) {
            const timer = setTimeout(clearMessages, 5000);
            return () => clearTimeout(timer);
        }
    });
</script>

<div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Trees class="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900">Forest Biometrics Analysis</h1>
                        <p class="text-slate-600">Start a new analysis project or continue working on an existing one</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Project Structure Info -->
        <!-- <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900 mb-4">Project Structure</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium text-slate-700">Total Phases:</span> {TOTAL_PHASE}
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium text-slate-700">Phase 1:</span> {PHASE_1_STEPS} steps
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium text-slate-700">Phase 2:</span> {PHASE_2_STEPS} steps
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium text-slate-700">Phase 3:</span> {PHASE_3_STEPS} steps
                </div>
                <div class="p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium text-slate-700">Phase 4:</span> {PHASE_4_STEPS} steps
                </div>
                <div class="p-3 bg-emerald-50 rounded-lg md:col-span-2">
                    <span class="font-medium text-emerald-700">Total Steps:</span> {PHASE_1_STEPS + PHASE_2_STEPS + PHASE_3_STEPS + PHASE_4_STEPS}
                </div>
            </div>
        </div> -->

        <!-- Messages -->
        {#if error}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        {/if}

        {#if success}
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-emerald-700">{success}</p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Action Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Plus class="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Create New Project</h3>
                            <p class="text-slate-600">Start a new forest biometric analysis</p>
                        </div>
                    </div>
                    <button 
                        onclick={() => showCreateForm = true}
                        disabled={loading}
                        class="w-full px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? 'Loading...' : 'Create New Project'}
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div class="p-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FolderOpen class="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-900">Continue Existing</h3>
                            <p class="text-slate-600">Resume work on a previous project</p>
                        </div>
                    </div>
                    <button 
                        onclick={() => document.getElementById('existing-projects')?.scrollIntoView({ behavior: 'smooth' })}
                        disabled={loading}
                        class="w-full px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                        View Existing Projects
                    </button>
                </div>
            </div>
        </div>

        <!-- Create New Project Form -->
        {#if showCreateForm}
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div class="p-6 border-b border-slate-200">
                    <h3 class="text-lg font-semibold text-slate-900">Create New Project</h3>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label for="projectName" class="block text-sm font-medium text-slate-700 mb-2">
                            Project Name *
                        </label>
                        <input 
                            id="projectName"
                            type="text" 
                            bind:value={projectName}
                            placeholder="Enter project name (letters, numbers, _, - only)..."
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            disabled={loading}
                        />
                        <p class="text-xs text-slate-500 mt-1">
                            Only letters, numbers, underscores (_), and hyphens (-) are allowed
                        </p>
                    </div>

                    <div>
                        <label for="projectDescription" class="block text-sm font-medium text-slate-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea 
                            id="projectDescription"
                            bind:value={projectDescription}
                            placeholder="Brief description of your forest analysis project..."
                            rows="3"
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            disabled={loading}
                        ></textarea>
                    </div>
                </div>
                <div class="flex justify-between p-6 border-t border-slate-200">
                    <button 
                        onclick={cancelCreate}
                        disabled={loading}
                        class="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onclick={createNewProject}
                        disabled={!projectName.trim() || loading}
                        class="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </div>
        {/if}

        <!-- Existing Projects -->
        <div id="existing-projects" class="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div class="p-6 border-b border-slate-200">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-900">Recent Projects</h3>
                    <button 
                        onclick={fetchProjects}
                        disabled={loading}
                        class="text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:text-slate-400 transition-colors"
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>
            
            <div class="p-6">
                {#if loading && existingProjects.length === 0}
                    <div class="text-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                        <p class="text-slate-600">Loading projects...</p>
                    </div>
                {:else if existingProjects.length === 0}
                    <div class="text-center py-12">
                        <FolderOpen class="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p class="text-slate-600">No projects found. Create your first project to get started.</p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each existingProjects as project}
                            <div class="bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer relative group"
                                 role="button"
                                 tabindex="0"
                                 onclick={() => selectProject(project)}
                                 onkeydown={(event) => event.key === 'Enter' && selectProject(project)}>
                            
                                <!-- Delete Button (appears on hover) -->
                                <button 
                                    onclick={(e) => showDeleteConfirmation(project, e)}
                                    class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete project"
                                >
                                    <Trash2 class="h-4 w-4" />
                                </button>
                                
                                <!-- Edit Button (appears on hover) -->
                                <button 
                                    onclick={(e) => startEditProject(project, e)}
                                    class="absolute top-2 right-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit project name"
                                >
                                    <Edit class="h-4 w-4" />
                                </button>
                            
                                <div class="p-6">
                                    <div class="flex items-start justify-between mb-3">
                                        <h4 class="text-lg font-semibold text-slate-900 truncate pr-8">
                                            {#if editingProject && editingProject.id === project.id}
                                                <div class="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        bind:value={editProjectName}
                                                        onclick={(e) => e.stopPropagation()}
                                                        class="px-2 py-1 text-lg font-semibold text-slate-900 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Project name"
                                                    />
                                                    <button 
                                                        onclick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            saveEditProject();
                                                        }}
                                                        disabled={loading}
                                                        class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
                                                        title="Save changes"
                                                    >
                                                        {loading ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button 
                                                        onclick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            cancelEditProject();
                                                        }}
                                                        disabled={loading}
                                                        class="px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white text-xs rounded disabled:opacity-50"
                                                        title="Cancel edit"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            {:else}
                                                {project.name}
                                            {/if}
                                        </h4>
                                        <span class="px-2 py-1 text-xs rounded-full {
                                            project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-800'
                                        }">
                                            {project.status_display || project.status}
                                        </span>
                                    </div>
                                    
                                    {#if project.description}
                                        <p class="text-slate-600 text-sm mb-4 line-clamp-2">
                                            {project.description}
                                        </p>
                                    {/if}
                                    
                                    <div class="space-y-2 text-xs text-slate-500">
                                        <div class="flex items-center gap-2">
                                            <Calendar class="h-3 w-3" />
                                            Created: {new Date(project.created_date).toLocaleDateString()}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <User class="h-3 w-3" />
                                            {getPhaseName(project.current_phase)} - Step {project.current_step}
                                        </div>
                                    </div>
                                    
                                    <div class="mt-4 pt-4 border-t border-slate-100">
                                        {#if project}
                                            {@const progress = calculateProgress(project)}
                                            <div class="flex items-center justify-between text-xs text-slate-500 mb-2">
                                                <span>Overall Progress</span>
                                                <span>{progress.currentStep} / {progress.totalSteps} steps</span>
                                            </div>
                                            <div class="w-full bg-slate-200 rounded-full h-2 mb-2">
                                                <div class="bg-emerald-600 h-2 rounded-full transition-all duration-300" style="width: {progress.percentage}%"></div>
                                            </div>
                                            
                                            <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                                                <span>{getPhaseName(project.current_phase)} Progress</span>
                                                <span>{project.current_step} / {[PHASE_1_STEPS, PHASE_2_STEPS, PHASE_3_STEPS, PHASE_4_STEPS][project.current_phase - 1]} steps</span>
                                            </div>
                                            <div class="w-full bg-slate-200 rounded-full h-1.5">
                                                <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style="width: {progress.phaseProgress}%"></div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Delete Project Confirmation Dialog -->
<ConfirmDialog
    bind:isVisible={showDeleteConfirm}
    title="Delete Project"
    type="danger"
    confirmText="Delete Project"
    requireTyping="DELETE"
    message={projectToDelete ? `⚠️  DELETE PROJECT WARNING  ⚠️

This action will permanently delete:
• Project: "${projectToDelete.name}"
• All project data and analysis results
• Database schema and tables
• Import history and tree measurements
• All completed analysis work

This includes:
- Biomass calculations
- Carbon stock estimates
- Volume calculations
- Height-diameter models
- All imported data

⚠️  THIS ACTION CANNOT BE UNDONE  ⚠️` : ''}
    onConfirm={confirmDeleteProject}
    onCancel={cancelDeleteProject}
/>
  