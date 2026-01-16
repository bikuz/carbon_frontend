<script lang="ts">
    import { Upload, CheckCircle, Database, Table, History, Plus } from '@lucide/svelte';
    import { onMount } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    
    // Props - expose selected data to parent and accept project ID
    let { 
        selectedData = $bindable<{ schemaName: string; tableName: string } | null>(null),
        projectId = $bindable<number>(0)
    } = $props();
    
    // Schema and table selection state
    let schemas: any[] = $state([]);
    let selectedSchema = $state('');
    let selectedTable = $state('');
    let availableTables: string[] = $state([]);
    let isLoadingSchemas = $state(false);
    let errorMessage = $state('');
    
    // Import history state
    let importHistory: any[] = $state([]);
    let isLoadingHistory = $state(false);
    let showNewSelection = $state(false);
    let hasExistingImports = $state(false);
    

    
    // Search/filter state
    let schemaSearchTerm = $state('');
    let tableSearchTerm = $state('');
    let isSchemaDropdownOpen = $state(false);
    let isTableDropdownOpen = $state(false);
    
    // Computed filtered lists
    let filteredSchemas = $derived(
        schemas.filter(schema => 
            schema.schema_name.toLowerCase().includes(schemaSearchTerm.toLowerCase()) ||
            (schema.tables && schema.tables.some((table: string) => 
                table.toLowerCase().includes(schemaSearchTerm.toLowerCase())
            ))
        )
    );
    
    let filteredTables = $derived(
        availableTables.filter(table => 
            table.toLowerCase().includes(tableSearchTerm.toLowerCase())
        )
    );
    
    // Load import history for the current project
    const loadImportHistory = async () => {
        if (!projectId) return;
        
        isLoadingHistory = true;
        errorMessage = '';
        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(projectId));
            
            // Check if response is OK before parsing
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }
            
            // Check content-type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                importHistory = data.results || [];
                // Only show history if there are completed imports
                const completedImports = importHistory.filter(imp => imp.status === 'completed');
                hasExistingImports = completedImports.length > 0;
                console.log('Loaded import history:', importHistory);
                
                // If there are existing completed imports and no selection is made, auto-select the latest successful import
                if (hasExistingImports && !selectedData) {
                    const latestSuccessfulImport = completedImports[0]; // First completed import (they're ordered by created_at DESC)
                    if (latestSuccessfulImport) {
                        selectedSchema = latestSuccessfulImport.schema_name;
                        selectedTable = latestSuccessfulImport.table_name;
                        selectedData = {
                            schemaName: latestSuccessfulImport.schema_name,
                            tableName: latestSuccessfulImport.table_name
                        };
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to load import history');
            }
        } catch (error) {
            console.error('Error loading import history:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to load import history';
        } finally {
            isLoadingHistory = false;
        }
    };

    // Load available schemas
    const loadSchemas = async () => {
        isLoadingSchemas = true;
        errorMessage = '';
        try {
            // Call the function with correct parameters: detailed=true, includeEmpty=false, importedOnly=true
            const response = await fetch(API_ENDPOINTS.INVENTORY_LIST_SCHEMAS(true, false, true));
            
            // Check if response is OK before parsing
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }
            
            // Check content-type to ensure it's JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                schemas = [...data.schemas]; // Force reactivity by creating a new array
                console.log('Loaded schemas for data import:', schemas);
            } else {
                throw new Error(data.error || 'Failed to load schemas');
            }
        } catch (error) {
            console.error('Error loading schemas:', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to load schemas';
        } finally {
            isLoadingSchemas = false;
        }
    };
    
    // Handle schema selection
    const handleSchemaChange = (schemaName: string) => {
        selectedSchema = schemaName;
        isSchemaDropdownOpen = false;
        isTableDropdownOpen = false; // Close table dropdown when schema changes
        schemaSearchTerm = '';
        
        if (selectedSchema && selectedSchema.trim() !== '') {
            const schema = schemas.find(s => s.schema_name === selectedSchema);
            if (schema && schema.tables) {
                availableTables = schema.tables;
                // Auto-select 'tree_and_climber' if it exists
                if (availableTables.includes('tree_and_climber')) {
                    selectedTable = 'tree_and_climber';
                } else {
                    selectedTable = availableTables[0] || '';
                }
                
                // Clear table search when schema changes
                tableSearchTerm = '';
                
                // Update parent with selected data
                selectedData = { 
                    schemaName: selectedSchema, 
                    tableName: selectedTable 
                };
            }
        } else {
            availableTables = [];
            selectedTable = '';
            tableSearchTerm = '';
            // Clear parent data when no schema is selected
            selectedData = null;
        }
    };
    
    // Handle table selection
    const handleTableChange = (tableName: string) => {
        selectedTable = tableName;
        isTableDropdownOpen = false;
        isSchemaDropdownOpen = false; // Close schema dropdown when table changes
        tableSearchTerm = '';
        
        // Update parent with selected data when table changes
        if (selectedSchema && selectedSchema.trim() !== '' && selectedTable && selectedTable.trim() !== '') {
            selectedData = { 
                schemaName: selectedSchema, 
                tableName: selectedTable 
            };
        } else {
            // Clear parent data if either schema or table is empty
            selectedData = null;
        }
    };

    // Handle continuing with an existing import
    const handleContinueWithImport = (importItem: any) => {
        selectedSchema = importItem.schema_name;
        selectedTable = importItem.table_name;
        selectedData = {
            schemaName: importItem.schema_name,
            tableName: importItem.table_name
        };
        showNewSelection = false;
    };

    // Handle selecting new schema/table
    const handleSelectNew = () => {
        showNewSelection = true;
        // Don't clear existing selection in case user cancels
    };

    // Handle canceling new selection
    const handleCancelNewSelection = () => {
        showNewSelection = false;
        // Revert to existing selection if available
        if (hasExistingImports) {
            const completedImports = importHistory.filter(imp => imp.status === 'completed');
            const latestSuccessfulImport = completedImports[0]; // First completed import (ordered by created_at DESC)
            if (latestSuccessfulImport) {
                selectedSchema = latestSuccessfulImport.schema_name;
                selectedTable = latestSuccessfulImport.table_name;
                selectedData = {
                    schemaName: latestSuccessfulImport.schema_name,
                    tableName: latestSuccessfulImport.table_name
                };
            }
        }
    };
    


    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Get status color for import status
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'failed':
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'processing':
            case 'pending':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };
    

    
    // Debug reactive statements
    $effect(() => {
        console.log('SelectSchema - Schemas updated:', schemas.length);
    });
    
    // Handle click outside to close dropdowns
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.schema-dropdown') && !target.closest('.table-dropdown')) {
            isSchemaDropdownOpen = false;
            isTableDropdownOpen = false;
        }
    };
    
    // Watch for projectId changes to reload import history
    $effect(() => {
        if (projectId) {
            loadImportHistory();
        }
    });

    // Load schemas on component mount
    onMount(() => {
        loadSchemas();
        if (projectId) {
            loadImportHistory();
        }
        document.addEventListener('click', handleClickOutside);
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });
</script>

<div>
    <!-- <h2 class="text-xl font-semibold text-slate-900 mb-4">Import Forest Data</h2>
    <p class="text-slate-600 mb-6">
        Upload your forest measurement data in CSV, Excel, or other supported formats. 
        Ensure your data includes tree diameter, height, species, and location information.
    </p> -->
    
    <!-- Import History Section -->
    {#if isLoadingHistory}
        <div class="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-center gap-2 text-slate-600">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                <span class="text-sm">Loading import history...</span>
            </div>
        </div>
    {:else if hasExistingImports && !showNewSelection}
        <div class="mb-6 space-y-4">
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <History size={20} />
                        Previous Data Imports
                    </h3>
                    <button
                        type="button"
                        onclick={handleSelectNew}
                        class="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                        <Plus size={16} />
                        Select New Data
                    </button>
                </div>
                
                <p class="text-slate-600 mb-4 text-sm">
                    You have previously imported data for this project. You can continue with existing data or select new sources.
                </p>
                
                <div class="space-y-3">
                    {#each importHistory.slice(0, 5).filter(item => item.status === 'completed') as importItem}
                        <button
                            type="button"
                            onclick={() => handleContinueWithImport(importItem)}
                            class="w-full bg-white rounded-lg border border-slate-200 p-4 hover:bg-slate-50 hover:border-emerald-200 transition-colors text-left {selectedSchema === importItem.schema_name && selectedTable === importItem.table_name ? 'ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50' : ''}"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="flex items-center gap-2">
                                            <Database size={16} class="text-slate-500" />
                                            <span class="font-medium text-slate-900">{importItem.schema_name}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <Table size={16} class="text-slate-500" />
                                            <span class="text-slate-700">{importItem.table_name}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-4 text-sm text-slate-600">
                                        <span class="px-2 py-1 rounded-md border text-xs {getStatusColor(importItem.status)}">
                                            {importItem.status || 'Unknown'}
                                        </span>
                                        <span>{formatDate(importItem.created_at)}</span>
                                        {#if importItem.imported_rows}
                                            <span>{importItem.imported_rows.toLocaleString()} rows</span>
                                        {/if}
                                    </div>
                                </div>
                                
                                {#if selectedSchema === importItem.schema_name && selectedTable === importItem.table_name}
                                    <div class="flex items-center gap-1 text-emerald-600 text-sm">
                                        <CheckCircle size={16} />
                                        <span>Selected</span>
                                    </div>
                                {/if}
                            </div>
                            
                            {#if importItem.description}
                                <p class="text-sm text-slate-600 mt-2">{importItem.description}</p>
                            {/if}
                        </button>
                    {/each}
                </div>
                
                {#if importHistory.filter(item => item.status === 'completed').length > 5}
                    <p class="text-sm text-slate-500 mt-3 text-center">
                        Showing latest 5 completed imports out of {importHistory.filter(item => item.status === 'completed').length} total
                    </p>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Schema and Table Selection -->
    {#if !hasExistingImports || showNewSelection}
        <div class="mb-6 space-y-4">
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-slate-900 flex items-center gap-2">
                        <Database size={20} />
                        Select Data Source
                    </h3>
                    {#if showNewSelection}
                        <button
                            type="button"
                            onclick={handleCancelNewSelection}
                            class="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    {/if}
                </div>
            
            {#if errorMessage}
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-sm text-red-700">{errorMessage}</p>
                </div>
            {/if}
            
            <!-- Schema Selection -->
            <div class="mb-4">
                <label for="schema-select-button" class="block text-sm font-medium text-slate-700 mb-2">
                    Schema
                </label>
                
                {#if isLoadingSchemas}
                    <div class="flex items-center gap-2 text-slate-600">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        <span class="text-sm">Loading schemas...</span>
                    </div>
                {:else}
                    <!-- Custom Schema Dropdown -->
                    <div class="relative schema-dropdown">
                        <button
                            type="button"
                            id="schema-select-button"
                            onclick={() => {
                                isSchemaDropdownOpen = !isSchemaDropdownOpen;
                                if (isSchemaDropdownOpen) {
                                    isTableDropdownOpen = false; // Close table dropdown when opening schema dropdown
                                }
                            }}
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-left bg-white flex items-center justify-between"
                        >
                            <span class={selectedSchema ? 'text-slate-900' : 'text-slate-500'}>
                                {selectedSchema ? `${selectedSchema} (${schemas.find(s => s.schema_name === selectedSchema)?.table_count || 0} tables)` : 'Select a schema'}
                            </span>
                            <svg class="w-4 h-4 text-slate-400 transition-transform {isSchemaDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        
                        {#if isSchemaDropdownOpen}
                            <div class="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                <!-- Search Input -->
                                <div class="p-2 border-b border-slate-200">
                                    <input
                                        type="text"
                                        bind:value={schemaSearchTerm}
                                        placeholder="Search schemas or tables..."
                                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                                        onfocus={() => {
                                            isSchemaDropdownOpen = true;
                                            isTableDropdownOpen = false; // Close table dropdown when focusing on schema search
                                        }}
                                    />
                                </div>
                                
                                <!-- Options List -->
                                <div class="max-h-48 overflow-y-auto">
                                    <button
                                        type="button"
                                        onclick={() => handleSchemaChange('')}
                                        class="w-full px-3 py-2 text-left hover:bg-slate-50 text-slate-500"
                                    >
                                        Select a schema
                                    </button>
                                    {#each filteredSchemas as schema}
                                        <button
                                            type="button"
                                            onclick={() => handleSchemaChange(schema.schema_name)}
                                            class="w-full px-3 py-2 text-left hover:bg-slate-50 {selectedSchema === schema.schema_name ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900'}"
                                        >
                                            {schema.schema_name} ({schema.table_count} tables)
                                        </button>
                                    {/each}
                                    {#if schemaSearchTerm && filteredSchemas.length === 0}
                                        <div class="px-3 py-2 text-slate-500 text-sm">
                                            No schemas found matching "{schemaSearchTerm}"
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <!-- Table Selection -->
            {#if selectedSchema && availableTables.length > 0}
                <div>
                    <label for="table-select-button" class="block text-sm font-medium text-slate-700 mb-2">
                        Table
                    </label>
                    
                    <!-- Custom Table Dropdown -->
                    <div class="relative table-dropdown">
                        <button
                            type="button"
                            id="table-select-button"
                            onclick={() => {
                                isTableDropdownOpen = !isTableDropdownOpen;
                                if (isTableDropdownOpen) {
                                    isSchemaDropdownOpen = false; // Close schema dropdown when opening table dropdown
                                }
                            }}
                            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-left bg-white flex items-center justify-between"
                        >
                            <span class={selectedTable ? 'text-slate-900' : 'text-slate-500'}>
                                {selectedTable || 'Select a table'}
                            </span>
                            <svg class="w-4 h-4 text-slate-400 transition-transform {isTableDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        
                        {#if isTableDropdownOpen}
                            <div class="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                <!-- Search Input -->
                                <div class="p-2 border-b border-slate-200">
                                    <input
                                        type="text"
                                        bind:value={tableSearchTerm}
                                        placeholder="Search tables..."
                                        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                                        onfocus={() => {
                                            isTableDropdownOpen = true;
                                            isSchemaDropdownOpen = false; // Close schema dropdown when focusing on table search
                                        }}
                                    />
                                </div>
                                
                                <!-- Options List -->
                                <div class="max-h-48 overflow-y-auto">
                                    {#each filteredTables as table}
                                        <button
                                            type="button"
                                            onclick={() => handleTableChange(table)}
                                            class="w-full px-3 py-2 text-left hover:bg-slate-50 {selectedTable === table ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900'} {table === 'tree_and_climber' ? 'font-medium' : ''}"
                                        >
                                            {table}
                                            {#if table === 'tree_and_climber'}
                                                <span class="ml-2 text-xs text-emerald-600">(Recommended)</span>
                                            {/if}
                                        </button>
                                    {/each}
                                    {#if tableSearchTerm && filteredTables.length === 0}
                                        <div class="px-3 py-2 text-slate-500 text-sm">
                                            No tables found matching "{tableSearchTerm}"
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                    
                    {#if selectedTable === 'tree_and_climber'}
                        <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Auto-selected: tree_and_climber table
                        </p>
                    {/if}
                </div>
            {/if}
            
            </div>
        </div>
    {/if}
    
    <!-- Current Selection Summary -->
    {#if selectedSchema && selectedTable}
        <div class="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div class="flex items-center gap-2">
                <CheckCircle class="h-4 w-4 text-emerald-600" />
                <span class="text-sm text-emerald-700">
                    {#if hasExistingImports && !showNewSelection}
                        <strong>Continuing with:</strong> {selectedSchema} → {selectedTable}
                    {:else}
                        <strong>Selected:</strong> {selectedSchema} → {selectedTable}
                    {/if}
                </span>
            </div>
        </div>
    {/if}
    
</div>
