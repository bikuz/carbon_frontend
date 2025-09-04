<script lang="ts">
    import { Eye, Database, FileText, AlertTriangle, CheckCircle, X, Plus, RefreshCw, Trash2 } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';

    // Props
    let { 
        projectId = $bindable<number>(0),
        schemaName = $bindable<string>(''),
        tableName = $bindable<string>(''),
        isVisible = $bindable<boolean>(false),
        onImportConfirm = $bindable<() => Promise<void>>(async () => {}),
        onCancel = $bindable<() => void>(() => {}),
        hasExistingData = $bindable<boolean>(false)
    } = $props();

    // State
    let isLoading = $state(false);
    let previewData = $state<any>(null);
    let errorMessage = $state('');
    let selectedAction = $state<'append' | 'replace_selected' | 'replace'>('append');

    // Load preview data when component becomes visible
    $effect(() => {
        if (isVisible && schemaName && tableName && projectId) {
            loadPreviewData();
        }
    });

    async function loadPreviewData() {
        if (!schemaName || !tableName || !projectId) return;

        isLoading = true;
        errorMessage = '';
        previewData = null;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORT_PREVIEW(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    schema_name: schemaName,
                    table_name: tableName
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch preview: ${response.statusText}`);
            }

            const responseData = await response.json();
            if (responseData.success && responseData.preview_data) {
                previewData = responseData.preview_data;
            } else {
                throw new Error(responseData.error || 'Failed to get preview data');
            }
        } catch (error) {
            console.error('Error loading preview data:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to load preview data.';
        } finally {
            isLoading = false;
        }
    }

    async function handleConfirmImport() {
        if (!selectedAction) return;

        try {
            await onImportConfirm();
            handleCancel(); // Close the dialog after successful import
        } catch (error) {
            console.error('Import failed:', error);
            errorMessage = error instanceof Error ? error.message : 'Import failed.';
        }
    }

    function handleCancel() {
        isVisible = false;
        onCancel();
        // Reset state
        previewData = null;
        errorMessage = '';
        selectedAction = 'append';
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }
</script>

{#if isVisible}
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <!-- Modal Content -->
        <div class="bg-white rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <Eye size={24} class="text-emerald-600" />
                        <div>
                            <h2 class="text-xl font-semibold text-slate-900">Data Preview</h2>
                            <p class="text-sm text-slate-600">
                                {schemaName}.{tableName}
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={handleCancel}
                        class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-slate-500" />
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {#if isLoading}
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span class="ml-3 text-slate-600">Loading preview...</span>
                    </div>
                {:else if errorMessage}
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center gap-2 text-red-700">
                            <AlertTriangle size={20} />
                            <span class="font-medium">Error</span>
                        </div>
                        <p class="text-red-600 mt-1">{errorMessage}</p>
                    </div>
                {:else if previewData}
                    <div class="space-y-6">
                        <!-- Data Statistics -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div class="flex items-center gap-2 text-emerald-700">
                                    <Database size={20} />
                                    <span class="font-medium">Total Rows</span>
                                </div>
                                <p class="text-2xl font-bold text-emerald-900 mt-1">
                                    {formatNumber(previewData.total_rows || 0)}
                                </p>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div class="flex items-center gap-2 text-blue-700">
                                    <FileText size={20} />
                                    <span class="font-medium">Columns</span>
                                </div>
                                <p class="text-2xl font-bold text-blue-900 mt-1">
                                    {previewData.columns?.length || 0}
                                </p>
                            </div>
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <div class="flex items-center gap-2 text-purple-700">
                                    <CheckCircle size={20} />
                                    <span class="font-medium">Data Quality</span>
                                </div>
                                <p class="text-sm font-medium text-purple-900 mt-1">
                                    {previewData.quality_score ? `${previewData.quality_score}%` : 'Good'}
                                </p>
                            </div>
                        </div>

                        <!-- Column Information -->
                        {#if previewData.columns && previewData.columns.length > 0}
                            <div>
                                <h3 class="text-lg font-medium text-slate-900 mb-3">Column Information</h3>
                                <div class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                    <div class="overflow-x-auto">
                                        <table class="w-full">
                                            <thead class="bg-slate-100">
                                                <tr>
                                                    <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Column</th>
                                                    <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Data Type</th>
                                                    <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Null Count</th>
                                                    <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Sample Values</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200">
                                                {#each previewData.columns as column}
                                                    <tr class="hover:bg-slate-50">
                                                        <td class="px-4 py-3 text-sm font-medium text-slate-900">{column.name}</td>
                                                        <td class="px-4 py-3 text-sm text-slate-600">{column.data_type}</td>
                                                        <td class="px-4 py-3 text-sm text-slate-600">{column.null_count || 0}</td>
                                                        <td class="px-4 py-3 text-sm text-slate-600">
                                                            {#if column.sample_values && column.sample_values.length > 0}
                                                                {column.sample_values.slice(0, 3).join(', ')}
                                                                {#if column.sample_values.length > 3}...{/if}
                                                            {:else}
                                                                <span class="text-slate-400">No samples</span>
                                                            {/if}
                                                        </td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Sample Data -->
                        {#if previewData.sample_data && previewData.sample_data.length > 0}
                            <div>
                                <h3 class="text-lg font-medium text-slate-900 mb-3">Sample Data (First 5 Rows)</h3>
                                <div class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                    <div class="overflow-x-auto">
                                        <table class="w-full">
                                            <thead class="bg-slate-100">
                                                <tr>
                                                    {#each Object.keys(previewData.sample_data[0] || {}) as column}
                                                        <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 whitespace-nowrap">
                                                            {column}
                                                        </th>
                                                    {/each}
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200">
                                                {#each previewData.sample_data.slice(0, 5) as row}
                                                    <tr class="hover:bg-slate-50">
                                                        {#each Object.values(row) as value}
                                                            <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                                {value !== null && value !== undefined ? String(value) : '-'}
                                                            </td>
                                                        {/each}
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Import Action Selection -->
                        <div class="bg-white rounded-lg p-4 border border-slate-200">
                            <h4 class="text-md font-medium text-slate-900 mb-3">Import Action</h4>
                            
                            <div class="space-y-3">
                                <label class="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="previewImportAction"
                                        value="append"
                                        bind:group={selectedAction}
                                        class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                    />
                                    <div class="flex items-center gap-2">
                                        <Plus size={16} class="text-emerald-600" />
                                        <span class="font-medium text-slate-900">Append Data</span>
                                    </div>
                                    <span class="text-sm text-slate-600">Add new data alongside existing records</span>
                                </label>

                                {#if hasExistingData}
                                    <label class="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="previewImportAction"
                                            value="replace_selected"
                                            bind:group={selectedAction}
                                            class="w-4 h-4 text-orange-600 border-slate-300 focus:ring-orange-500"
                                        />
                                        <div class="flex items-center gap-2">
                                            <RefreshCw size={16} class="text-orange-600" />
                                            <span class="font-medium text-slate-900">Replace Selected Schema/Table Only</span>
                                        </div>
                                        <span class="text-sm text-slate-600">Remove only data from the same schema/table combination, then add new data</span>
                                    </label>

                                    <label class="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="previewImportAction"
                                            value="replace"
                                            bind:group={selectedAction}
                                            class="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                                        />
                                        <div class="flex items-center gap-2">
                                            <Trash2 size={16} class="text-red-600" />
                                            <span class="font-medium text-slate-900">Replace All Data</span>
                                        </div>
                                        <span class="text-sm text-slate-600">Remove all existing data from all sources, then add new data</span>
                                    </label>
                                {/if}
                            </div>

                            {#if hasExistingData}
                                <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div class="flex items-center gap-2 text-yellow-800">
                                        <AlertTriangle size={16} />
                                        <span class="text-sm font-medium">Existing Data Detected</span>
                                    </div>
                                    <div class="text-sm text-yellow-700 mt-1">
                                        <p>Choose your import action carefully. The selected action will determine how the new data interacts with existing records.</p>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <div class="text-center py-12 text-slate-500">
                        <Eye size={48} class="mx-auto mb-4 text-slate-300" />
                        <p>No preview data available</p>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button
                    onclick={handleCancel}
                    class="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={handleConfirmImport}
                    disabled={isLoading || !previewData}
                    class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {hasExistingData ? `Execute ${selectedAction === 'replace' ? 'Replace All' : selectedAction === 'replace_selected' ? 'Replace Selected' : 'Append'}` : 'Import Data'}
                </button>
            </div>
        </div>
    </div>
{/if}
