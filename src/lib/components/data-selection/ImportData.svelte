<script lang="ts">
    import { Upload, CheckCircle, AlertTriangle, Eye, Plus, RefreshCw, Database, Trash2 } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { onMount } from 'svelte';
    import { DataPreview, ImportHistory } from '$lib/components/data-selection';

    // Props
    let { 
        selectedSchemaData = $bindable<{ schemaName: string; tableName: string } | null>(null),
        importResults = $bindable<any>(null),
        projectId = $bindable<number>(0),
        cameFromStep1 = $bindable<boolean>(false),
        hasExistingData = $bindable<boolean>(false)
    } = $props();

    // State
    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let showPreview = $state(false);
    let existingImports = $state<any[]>([]);
    let refreshHistoryTrigger = $state(0);
    let previewSchemaName = $state('');
    let previewTableName = $state('');
    let selectedAction = $state<'append' | 'replace_selected' | 'replace'>('append');
    
    // Computed property to determine if import section should be shown
    let showImportSection = $derived(
        // Show import section only if user came from step 1 (SelectSchema.svelte)
        // and has selected schema/table, OR if no existing imports (first time import)
        (cameFromStep1 && selectedSchemaData?.schemaName && selectedSchemaData?.tableName) || existingImports.length === 0
    );
    
    // Update preview data when selectedSchemaData changes
    $effect(() => {
        previewSchemaName = selectedSchemaData?.schemaName || '';
        previewTableName = selectedSchemaData?.tableName || '';
    });

    // Check for existing imports when component mounts
    onMount(async () => {
        if (projectId) {
            await loadExistingImports();
        }
    });

    // Load existing imports to check if data already exists
    async function loadExistingImports() {
        if (!projectId) return;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(projectId));
            if (response.ok) {
                const data = await response.json();
                existingImports = data.results || data || [];
                hasExistingData = existingImports.length > 0;
            }
        } catch (error) {
            console.error('Error loading existing imports:', error);
        }
    }

    async function handleImportData() {
        if (!selectedSchemaData?.schemaName || !selectedSchemaData?.tableName) {
            errorMessage = 'Please select a schema and table in the previous step.';
            return;
        }

        if (!projectId) {
            errorMessage = 'Project ID is required for data import.';
            return;
        }

        isLoading = true;
        errorMessage = '';
        successMessage = '';
        importResults = null;

        try {
            const requestBody = {
                schema_name: selectedSchemaData.schemaName,
                table_name: selectedSchemaData.tableName,
                action: selectedAction,
                description: `Imported from ${selectedSchemaData.schemaName}.${selectedSchemaData.tableName}`
            };

            console.log('Sending import request with action:', selectedAction, 'requestBody:', requestBody);

            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORT_CREATE(projectId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Import failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            importResults = {
                success: true,
                imported_rows: result.imported_rows || 0,
                import_id: result.id,
                action: selectedAction,
                message: `Successfully ${selectedAction === 'replace' ? 'replaced all data' : selectedAction === 'replace_selected' ? 'replaced data for selected schema/table' : 'imported'} data from ${selectedSchemaData.schemaName}.${selectedSchemaData.tableName}.`
            };
            
            successMessage = importResults.message;
            
            // Refresh import history and existing data status
            await loadExistingImports();
            refreshHistoryTrigger += 1;

        } catch (error) {
            console.error('Error during data import:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to import data.';
            importResults = { 
                success: false, 
                error: errorMessage, 
                imported_rows: 0,
                action: selectedAction
            };
        } finally {
            isLoading = false;
        }
    }
    


    function handleShowPreview() {
        if (!selectedSchemaData?.schemaName || !selectedSchemaData?.tableName) {
            errorMessage = 'Please select a schema and table in the previous step.';
            return;
        }
        showPreview = true;
    }

    function handlePreviewCancel() {
        showPreview = false;
    }

    async function handlePreviewImportConfirm() {
        showPreview = false;
        await handleImportData();
    }

    function handleImportDeleted() {
        // Refresh the data when an import is deleted
        loadExistingImports();
        refreshHistoryTrigger += 1;
    }

    // Clear messages after a few seconds
    $effect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                errorMessage = '';
                successMessage = '';
            }, 5000);
            return () => clearTimeout(timer);
        }
    });

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }
</script>

<div class="space-y-6">
    <div>
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Import Data</h2>
        <p class="text-slate-600 mb-6">
            Import forest measurement data from selected schemas and tables. You can import multiple data sources and choose whether to replace or append to existing data.
        </p>
    </div>

    {#if errorMessage}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20} />
                <span class="font-medium">Error</span>
            </div>
            <p class="text-red-600 mt-1">{errorMessage}</p>
        </div>
    {/if}

    {#if successMessage}
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-emerald-700">
                <CheckCircle size={20} />
                <span class="font-medium">Success</span>
            </div>
            <p class="text-emerald-600 mt-1">{successMessage}</p>
        </div>
    {/if}

    <!-- Import Section - Only show if user has selected schema/table OR no existing imports -->
    {#if showImportSection}
        <!-- Current Selection -->
        {#if selectedSchemaData?.schemaName && selectedSchemaData?.tableName}
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 class="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <Database size={20} class="text-emerald-600" />
                    Selected Data Source
                </h3>
                
                <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-slate-900">
                                {selectedSchemaData.schemaName}.{selectedSchemaData.tableName}
                            </p>
                            <p class="text-sm text-slate-600">Ready for import</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                onclick={handleShowPreview}
                                disabled={isLoading}
                                class="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Eye size={16} />
                                Preview
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Import Action Selection -->
                <div class="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                    <h4 class="text-md font-medium text-slate-900 mb-3">Import Action</h4>
                    
                    <div class="space-y-3">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="importAction"
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
                                    name="importAction"
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
                                    name="importAction"
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
                </div>

                <!-- Execute Import Button -->
                <div class="flex justify-center">
                    <button
                        onclick={handleImportData}
                        disabled={isLoading}
                        class="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {#if isLoading}
                            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Importing...</span>
                        {:else}
                            <Upload size={20} />
                            <span>Execute Import</span>
                        {/if}
                    </button>
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
        {:else}
            <div class="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <Database size={48} class="mx-auto mb-4 text-slate-300" />
                <h3 class="text-lg font-medium text-slate-600 mb-2">No Data Source Selected</h3>
                <p class="text-slate-500">
                    Please go back to Step 1 and select a schema and table before importing data.
                </p>
            </div>
        {/if}
    {:else}
        <!-- Show message when import section is hidden due to existing data -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div class="flex items-center gap-3 text-emerald-700 mb-3">
                <CheckCircle size={24} />
                <h3 class="text-lg font-medium">Data Already Imported</h3>
            </div>
            <p class="text-emerald-600 mb-4">
                You have existing imported data. You can continue to the next step or select a new schema and table from Step 1 to import additional data.
            </p>
            <div class="flex items-center gap-2 text-sm text-emerald-600">
                <Database size={16} />
                <span>{existingImports.length} import{existingImports.length !== 1 ? 's' : ''} available</span>
            </div>
        </div>
    {/if}

    <!-- Import History -->
    {#if projectId}
        <ImportHistory 
            bind:projectId={projectId}
            bind:onImportDeleted={handleImportDeleted}
            bind:refreshTrigger={refreshHistoryTrigger}
        />
    {/if}

    <!-- Data Preview Modal -->
    {#if showPreview}
        <DataPreview
            bind:projectId={projectId}
            bind:schemaName={previewSchemaName}
            bind:tableName={previewTableName}
            bind:isVisible={showPreview}
            bind:onImportConfirm={handlePreviewImportConfirm}
            bind:onCancel={handlePreviewCancel}
            hasExistingData={hasExistingData}
        />
    {/if}
</div>