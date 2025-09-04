<script lang="ts">
    import { Database, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Filter, Search, Eye } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { onMount } from 'svelte';
    import DataQualityIssueDetails from './DataQualityIssueDetails.svelte';
    import { debug, debugAPI, debugComponent, debugPerformance, debugError, debugWarn } from '$lib/utils/debug.js';

    // Props
    let { 
        projectId = $bindable<number>(0),
        qualityCheckResults = $bindable<any>(null),
        onQualityCheckComplete = $bindable<() => void>(() => {})
    } = $props();

    // State
    let selectedOption = $state<'selected' | 'all'>('selected');
    let selectedSchemaData = $state<number | null>(null);
    let availableImports = $state<any[]>([]);
    let isLoading = $state(false);
    let isProcessing = $state(false);
    let isRefreshing = $state(false);
    let currentStep = $state<string>('');
    let showIssueDetails = $state(false);
    let selectedIssue = $state<any>(null);
    let errorMessage = $state('');
    let successMessage = $state('');
    let lastQualityCheckParams = $state<any>(null);

    // Load available imports when component mounts
    onMount(async () => {
        if (projectId) {
            await loadAvailableImports();
        }
    });

    // Load available imports for selection
    async function loadAvailableImports() {
        if (!projectId) return;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(projectId));
            if (response.ok) {
                const data = await response.json();
                availableImports = (data.results || data || []).filter((imp: any) => 
                    imp.status === 'completed' && imp.imported_rows > 0
                );
            }
        } catch (error) {
            debugError('DataQualityCheck', 'Error loading available imports', error);
            errorMessage = 'Failed to load available imports.';
        }
    }

    // Start data quality check
    async function startQualityCheck() {
        if (selectedOption === 'selected' && !selectedSchemaData) {
            errorMessage = 'Please select a schema and table for quality check.';
            return;
        }

        const startTime = performance.now();
        isLoading = true;
        isProcessing = true;
        errorMessage = '';
        successMessage = '';
        qualityCheckResults = null;

        try {
            let schemaData = null;
            if (selectedOption === 'selected' && selectedSchemaData) {
                schemaData = { import_id: selectedSchemaData };
            }

            const requestBody = {
                check_type: selectedOption,
                schema_data: schemaData
            };

            // Store the parameters for refresh functionality
            lastQualityCheckParams = requestBody;

            debug('DataQualityCheck', 'Starting quality check', {
                requestBody,
                projectId,
                selectedOption,
                selectedSchemaData
            });

            const url = API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_CHECK(projectId);
            
            debugAPI('POST', url, requestBody, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Quality check failed: ${response.statusText}`);
            }

            const result = await response.json();
            debugAPI('POST', url, result, 'response');
            
            if (result.success) {
                qualityCheckResults = result.results;
                successMessage = 'Data quality check completed successfully!';
                
                debug('DataQualityCheck', 'Quality check completed successfully', {
                    totalRecords: result.results?.totalRecords,
                    totalIssues: result.results?.totalIssues,
                    qualityScore: result.results?.qualityScore
                });
            } else {
                throw new Error(result.error || 'Quality check failed');
            }
            
            // Notify parent component
            onQualityCheckComplete();

        } catch (error) {
            debugError('DataQualityCheck', 'Error during quality check', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to perform quality check.';
        } finally {
            isLoading = false;
            isProcessing = false;
            debugPerformance('DataQualityCheck - startQualityCheck', startTime);
        }
    }

    // Refresh quality check results
    async function refreshQualityCheck() {
        if (!lastQualityCheckParams) {
            errorMessage = 'No previous quality check to refresh. Please run a quality check first.';
            return;
        }

        const startTime = performance.now();
        isRefreshing = true;
        errorMessage = '';
        successMessage = '';

        try {
            debug('DataQualityCheck', 'Refreshing quality check', lastQualityCheckParams);

            const url = API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_CHECK(projectId);
            
            debugAPI('POST', url, lastQualityCheckParams, 'refresh-request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lastQualityCheckParams)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Quality check refresh failed: ${response.statusText}`);
            }

            const result = await response.json();
            debugAPI('POST', url, result, 'refresh-response');
            
            if (result.success) {
                qualityCheckResults = result.results;
                successMessage = 'Quality check results refreshed successfully!';
                
                debug('DataQualityCheck', 'Quality check refreshed successfully', {
                    totalRecords: result.results?.totalRecords,
                    totalIssues: result.results?.totalIssues,
                    qualityScore: result.results?.qualityScore
                });
            } else {
                throw new Error(result.error || 'Quality check refresh failed');
            }

        } catch (error) {
            debugError('DataQualityCheck', 'Error during quality check refresh', error);
            errorMessage = error instanceof Error ? error.message : 'Failed to refresh quality check.';
        } finally {
            isRefreshing = false;
            debugPerformance('DataQualityCheck - refreshQualityCheck', startTime);
        }
    }

    // Handle issue selection
    function handleIssueSelect(issue: any) {
        debug('DataQualityCheck', 'Issue selected', issue);
        selectedIssue = issue;
        showIssueDetails = true;
        debug('DataQualityCheck', 'Modal state after selection', { selectedIssue, showIssueDetails });
    }

    // Handle issue details close
    function handleIssueDetailsClose() {
        debug('DataQualityCheck', 'Issue details modal closed');
        showIssueDetails = false;
        selectedIssue = null;
    }

    // Handle issue correction completion
    function handleIssueCorrectionComplete() {
        debug('DataQualityCheck', 'Issue correction completed', { selectedIssue });
        
        // Refresh quality check results after correction
        if (qualityCheckResults) {
            // Update the specific issue status in results
            if (selectedIssue && qualityCheckResults.issues) {
                const issueIndex = qualityCheckResults.issues.findIndex((i: any) => i.type === selectedIssue.type);
                if (issueIndex !== -1) {
                    qualityCheckResults.issues[issueIndex].status = 'corrected';
                    debug('DataQualityCheck', 'Updated issue status to corrected', { 
                        issueType: selectedIssue.type, 
                        issueIndex 
                    });
                }
            }
        }
        handleIssueDetailsClose();
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }

    function getIssueIcon(type: string) {
        switch (type) {
            case 'plot_code':
                return Database;
            case 'phy_zone':
                return AlertTriangle;
            case 'tree_no':
                return AlertCircle;
            case 'species_code':
                return Search;
            case 'dbh':
                return AlertTriangle;
            default:
                return AlertCircle;
        }
    }

    function getIssueColor(type: string): string {
        switch (type) {
            case 'plot_code':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'phy_zone':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'tree_no':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'species_code':
                return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'dbh':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default:
                return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    }

    function getIssueTitle(type: string): string {
        switch (type) {
            case 'plot_code':
                return 'Plot Code Generation';
            case 'phy_zone':
                return 'Physiography Zone Validation';
            case 'tree_no':
                return 'Tree Number Validation';
            case 'species_code':
                return 'Species Code Validation';
            case 'dbh':
                return 'DBH Validation';
            default:
                return 'Unknown Issue';
        }
    }
</script>

<div class="space-y-6">
    <div>
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Data Quality Check</h2>
        <p class="text-slate-600 mb-6">
            Perform comprehensive data quality checks on your imported forest measurement data.
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

    {#if !qualityCheckResults}
        <!-- Quality Check Options -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Select Quality Check Scope</h3>
            
            <div class="space-y-4">
                <!-- Option 1: Selected Schema Data -->
                <label class="flex items-start gap-3 cursor-pointer">
                    <input
                        type="radio"
                        name="qualityCheckOption"
                        value="selected"
                        bind:group={selectedOption}
                        class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-1"
                    />
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <Database size={16} class="text-emerald-600" />
                            <span class="font-medium text-slate-900">Check Selected Schema Data</span>
                        </div>
                        <p class="text-sm text-slate-600 mt-1">
                            Perform quality check only on data from a specific imported schema and table.
                        </p>
                    </div>
                </label>

                <!-- Option 2: Recalculate All -->
                <label class="flex items-start gap-3 cursor-pointer">
                    <input
                        type="radio"
                        name="qualityCheckOption"
                        value="all"
                        bind:group={selectedOption}
                        class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 mt-1"
                    />
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <RefreshCw size={16} class="text-emerald-600" />
                            <span class="font-medium text-slate-900">Recalculate All Data</span>
                        </div>
                        <p class="text-sm text-slate-600 mt-1">
                            Perform comprehensive quality check on all imported data across all schemas.
                        </p>
                    </div>
                </label>
            </div>

            <!-- Schema Selection (only for selected option) -->
            {#if selectedOption === 'selected'}
                <div class="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 class="text-md font-medium text-slate-900 mb-3">Select Schema and Table</h4>
                    
                    {#if availableImports.length === 0}
                        <div class="text-center py-4">
                            <Database size={32} class="mx-auto mb-2 text-slate-300" />
                            <p class="text-slate-500">No completed imports available for quality check.</p>
                        </div>
                    {:else}
                        <div class="space-y-2">
                            {#each availableImports as importItem}
                                <label class="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        name="selectedSchema"
                                        value={importItem.id}
                                        bind:group={selectedSchemaData}
                                        class="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                    />
                                    <div class="flex-1">
                                        <div class="font-medium text-slate-900">
                                            {importItem.schema_name}.{importItem.table_name}
                                        </div>
                                        <div class="text-sm text-slate-600">
                                            {formatNumber(importItem.imported_rows)} records • Imported {new Date(importItem.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Start Quality Check Button -->
            <div class="mt-6 flex justify-center">
                <button
                    onclick={startQualityCheck}
                    disabled={isLoading || (selectedOption === 'selected' && !selectedSchemaData)}
                    class="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {#if isLoading}
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Starting Quality Check...</span>
                    {:else}
                        <CheckCircle size={20} />
                        <span>Start Quality Check</span>
                    {/if}
                </button>
            </div>
        </div>
    {:else}
        <!-- Quality Check Results -->
        <div class="space-y-6">
            <!-- Summary -->
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div class="flex items-center gap-2 text-emerald-700 mb-3">
                    <CheckCircle size={20} />
                    <h3 class="text-lg font-medium">Quality Check Summary</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="text-emerald-600">Total Records Checked:</span>
                        <span class="font-medium text-emerald-900 ml-1">{formatNumber(qualityCheckResults.totalRecords || 0)}</span>
                    </div>
                    <div>
                        <span class="text-emerald-600">Issues Found:</span>
                        <span class="font-medium text-emerald-900 ml-1">{formatNumber(qualityCheckResults.totalIssues || 0)}</span>
                    </div>
                    <div>
                        <span class="text-emerald-600">Quality Score:</span>
                        <span class="font-medium text-emerald-900 ml-1">{qualityCheckResults.qualityScore || 0}%</span>
                    </div>
                </div>
            </div>

            <!-- Issues by Category -->
            {#if qualityCheckResults.issues && qualityCheckResults.issues.length > 0}
                <div class="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-slate-900 mb-4">Issues by Category</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each qualityCheckResults.issues as issue}
                            <div class="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                 onclick={() => handleIssueSelect(issue)}>
                                <div class="flex items-center gap-3 mb-3">
                                    <div class={`p-2 rounded-lg ${getIssueColor(issue.type)}`}>
                                        {#if issue.type === 'plot_code'}
                                            <Database size={16} />
                                        {:else if issue.type === 'phy_zone'}
                                            <AlertTriangle size={16} />
                                        {:else if issue.type === 'tree_no'}
                                            <AlertCircle size={16} />
                                        {:else if issue.type === 'species_code'}
                                            <Search size={16} />
                                        {:else if issue.type === 'dbh'}
                                            <AlertTriangle size={16} />
                                        {:else}
                                            <AlertCircle size={16} />
                                        {/if}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-medium text-slate-900">{getIssueTitle(issue.type)}</h4>
                                        <p class="text-sm text-slate-600">{formatNumber(issue.count)} issues</p>
                                    </div>
                                    <Eye size={16} class="text-slate-400" />
                                </div>
                                
                                <div class="text-xs text-slate-500">
                                    {#if issue.count === 0}
                                        <span class="text-emerald-600">● No Issues</span>
                                    {:else if issue.status === 'pending'}
                                        <span class="text-yellow-600">● Pending Review</span>
                                    {:else if issue.status === 'corrected'}
                                        <span class="text-emerald-600">● Corrected</span>
                                    {:else}
                                        <span class="text-slate-600">● New</span>
                                    {/if}
                                    
                                    {#if issue.ignored_count > 0}
                                        <div class="mt-1">
                                            <span class="text-orange-600">● {formatNumber(issue.ignored_count)} ignored</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                    <CheckCircle size={48} class="mx-auto mb-4 text-emerald-600" />
                    <h3 class="text-lg font-medium text-emerald-900 mb-2">No Issues Found!</h3>
                    <p class="text-emerald-700">
                        Your data has passed all quality checks. No issues detected.
                    </p>
                </div>
            {/if}

            <!-- Action Buttons -->
            <div class="flex justify-start gap-3">
                <button
                    onclick={() => qualityCheckResults = null}
                    class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                    Run New Check
                </button>
                
                <button
                    onclick={refreshQualityCheck}
                    disabled={isRefreshing}
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {#if isRefreshing}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Refreshing...</span>
                    {:else}
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    {/if}
                </button>
            </div>
        </div>
    {/if}
</div>

<!-- Issue Details Modal -->
{#if showIssueDetails && selectedIssue}
    <DataQualityIssueDetails
        bind:projectId={projectId}
        bind:issue={selectedIssue}
        bind:isVisible={showIssueDetails}
        bind:onClose={handleIssueDetailsClose}
        bind:onCorrectionComplete={handleIssueCorrectionComplete}
    />
{/if}
