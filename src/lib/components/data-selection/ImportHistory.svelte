<script lang="ts">
    import { Database, Calendar, Trash2, FileText, AlertCircle, CheckCircle, Clock } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { onMount } from 'svelte';
    import ConfirmDialog from '$lib/components/common/ConfirmDialog.svelte';

    // Props
    let { 
        projectId = $bindable<number>(0),
        onImportDeleted = $bindable<() => void>(() => {}),
        refreshTrigger = $bindable<number>(0)
    } = $props();

    // State
    let imports = $state<any[]>([]);
    let isLoading = $state(false);
    let errorMessage = $state('');
    let deletingImportId = $state<number | null>(null);
    let showDeleteConfirm = $state(false);
    let importToDelete = $state<any>(null);

    // Load imports when component mounts or refresh is triggered
    $effect(() => {
        if (projectId && refreshTrigger >= 0) {
            loadImports();
        }
    });

    onMount(() => {
        if (projectId) {
            loadImports();
        }
    });

    async function loadImports() {
        if (!projectId) return;

        isLoading = true;
        errorMessage = '';

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(projectId));
            
            if (!response.ok) {
                throw new Error(`Failed to fetch imports: ${response.statusText}`);
            }

            const data = await response.json();
            imports = data.results || data || [];
        } catch (error) {
            console.error('Error loading imports:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to load import history.';
            imports = [];
        } finally {
            isLoading = false;
        }
    }

    function showDeleteConfirmation(importItem: any) {
        importToDelete = importItem;
        showDeleteConfirm = true;
    }

    async function confirmDeleteImport() {
        if (!projectId || !importToDelete) return;

        deletingImportId = importToDelete.id;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORT_DELETE(projectId, importToDelete.id), {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Failed to delete import: ${response.statusText}`);
            }

            // Remove from local state
            imports = imports.filter(imp => imp.id !== importToDelete.id);
            onImportDeleted();
        } catch (error) {
            console.error('Error deleting import:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to delete import.';
        } finally {
            deletingImportId = null;
            importToDelete = null;
        }
    }

    function cancelDeleteImport() {
        importToDelete = null;
    }

    function formatDate(dateString: string): string {
        try {
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateString));
        } catch {
            return dateString;
        }
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }

    function getStatusIcon(status: string) {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                return CheckCircle;
            case 'failed':
            case 'error':
                return AlertCircle;
            case 'pending':
            case 'processing':
                return Clock;
            default:
                return Database;
        }
    }

    function getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'failed':
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'pending':
            case 'processing':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default:
                return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Database size={20} class="text-emerald-600" />
            Import History
        </h3>
        {#if imports.length > 0}
            <button
                onclick={loadImports}
                disabled={isLoading}
                class="text-sm text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
                {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
        {/if}
    </div>

    {#if errorMessage}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span class="font-medium">Error</span>
            </div>
            <p class="text-red-600 mt-1">{errorMessage}</p>
        </div>
    {/if}

    {#if isLoading}
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span class="ml-3 text-slate-600">Loading imports...</span>
        </div>
    {:else if imports.length === 0}
        <div class="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <Database size={48} class="mx-auto mb-4 text-slate-300" />
            <h4 class="text-lg font-medium text-slate-600 mb-2">No Data Imports Yet</h4>
            <p class="text-slate-500">
                Import data from schemas to get started with your analysis.
            </p>
        </div>
    {:else}
    <!-- Summary -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle size={16} />
            <span class="font-medium">Import Summary</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
                <span class="text-emerald-600">Total Imports:</span>
                <span class="font-medium text-emerald-900 ml-1">{imports.length}</span>
            </div>
            <div>
                <span class="text-emerald-600">Total Rows:</span>
                <span class="font-medium text-emerald-900 ml-1">
                    {formatNumber(imports.reduce((sum, imp) => sum + (imp.imported_rows || 0), 0))}
                </span>
            </div>
            <div>
                <span class="text-emerald-600">Unique Sources:</span>
                <span class="font-medium text-emerald-900 ml-1">
                    {new Set(imports.map(imp => `${imp.schema_name}.${imp.table_name}`)).size}
                </span>
            </div>
        </div>
    </div>
        <div class="space-y-3">
            {#each imports as importItem (importItem.id)}
                <div class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="flex items-center gap-2">
                                    <FileText size={16} class="text-slate-500" />
                                    <span class="font-medium text-slate-900">
                                        {importItem.schema_name}.{importItem.table_name}
                                    </span>
                                </div>
                                <!-- Status Badge -->
                                <div class={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(importItem.status)}`}>
                                    {#if importItem.status?.toLowerCase() === 'completed' || importItem.status?.toLowerCase() === 'success'}
                                        <CheckCircle size={12} />
                                    {:else if importItem.status?.toLowerCase() === 'failed' || importItem.status?.toLowerCase() === 'error'}
                                        <AlertCircle size={12} />
                                    {:else if importItem.status?.toLowerCase() === 'pending' || importItem.status?.toLowerCase() === 'processing'}
                                        <Clock size={12} />
                                    {:else}
                                        <Database size={12} />
                                    {/if}
                                    {importItem.status || 'Unknown'}
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                                <div class="flex items-center gap-2">
                                    <Database size={14} />
                                    <span>{formatNumber(importItem.imported_rows || 0)} rows</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{formatDate(importItem.created_at || importItem.import_date || '')}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>
                                        {importItem.action === 'replace' ? 'Replaced existing data' : 'Appended to existing data'}
                                    </span>
                                </div>
                            </div>

                            {#if importItem.description}
                                <p class="text-sm text-slate-600 mt-2">{importItem.description}</p>
                            {/if}
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2 ml-4">
                            <button
                                onclick={() => showDeleteConfirmation(importItem)}
                                disabled={deletingImportId === importItem.id}
                                class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete import"
                            >
                                {#if deletingImportId === importItem.id}
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                {:else}
                                    <Trash2 size={16} />
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        
    {/if}
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
    bind:isVisible={showDeleteConfirm}
    title="Delete Data Import"
    type="danger"
    confirmText="Delete Import"
    requireTyping="DELETE"
    message={importToDelete ? `⚠️  DELETE DATA IMPORT WARNING  ⚠️

This action will permanently delete:
• Import record for ${importToDelete.schema_name} → ${importToDelete.table_name}
• ${formatNumber(importToDelete.imported_rows || 0)} tree measurement records from the analysis database
• ALL COMPLETED OR IN-PROGRESS ANALYSIS based on this data

This includes:
- Biomass calculations
- Carbon stock estimates  
- Growth projections
- Volume calculations
- Height-diameter models

⚠️  THIS ACTION CANNOT BE UNDONE  ⚠️` : ''}
    bind:onConfirm={confirmDeleteImport}
    bind:onCancel={cancelDeleteImport}
/>
