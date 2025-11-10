<script lang="ts">
    import { X, ChevronLeft, ChevronRight, Database } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    
    // Props
    interface Props {
        showModal: boolean;
        projectId: number;
        phyZone: number;
        zoneName?: string;
        onClose: () => void;
    }
    
    let {
        showModal,
        projectId,
        phyZone,
        zoneName = '',
        onClose
    }: Props = $props();
    
    // State
    let treeData = $state<any[]>([]);
    let isLoading = $state(false);
    let currentPage = $state(1);
    let pageSize = $state(20);
    let totalRecords = $state(0);
    let totalPages = $state(1);
    
    // Load tree data when modal opens or page changes
    $effect(() => {
        if (showModal && projectId && phyZone) {
            loadTreeData();
        }
    });
    
    async function loadTreeData() {
        if (!projectId || !phyZone) return;
        
        isLoading = true;
        try {
            const url = `${API_ENDPOINTS.MRV_PROJECT_DATA_CLEANING_VIEW_RECORDS(projectId)}?phy_zone=${phyZone}&page=${currentPage}&page_size=${pageSize}`;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.records) {
                    treeData = data.records;
                    totalRecords = data.pagination?.total_records || 0;
                    totalPages = data.pagination?.total_pages || 1;
                    debug('Loaded tree data:', { treeData, totalRecords, totalPages });
                }
            } else {
                debug('Failed to load tree data:', response.status);
                const errorData = await response.json().catch(() => ({}));
                debug('Error response data:', errorData);
            }
        } catch (error) {
            debug('Error loading tree data:', error);
        } finally {
            isLoading = false;
        }
    }
    
    function handlePageChange(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            loadTreeData();
        }
    }
    
    function handlePageSizeChange(newPageSize: number) {
        pageSize = newPageSize;
        currentPage = 1;
        loadTreeData();
    }
    
    // Reset when modal closes
    $effect(() => {
        if (!showModal) {
            treeData = [];
            currentPage = 1;
            totalRecords = 0;
            totalPages = 1;
        }
    });
</script>

{#if showModal}
    <!-- Modal Backdrop -->
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
        role="button"
        tabindex="-1"
        onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
        <!-- Modal Content -->
        <div class="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <Database size={24} class="text-blue-600" />
                        <div>
                            <h2 class="text-xl font-semibold text-slate-900">
                                Tree Data - {zoneName || `Zone ${phyZone}`}
                            </h2>
                            <p class="text-sm text-slate-600">Total Records: {totalRecords}</p>
                        </div>
                    </div>
                    <button
                        onclick={onClose}
                        class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-slate-500" />
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-hidden flex flex-col">
                <!-- Pagination Controls (Top) -->
                <div class="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                    <div class="flex items-center gap-4">
                        <label for="page-size-select" class="text-sm text-slate-600">Page Size:</label>
                        <select
                            id="page-size-select"
                            value={pageSize}
                            onchange={(e) => handlePageSizeChange(Number((e.target as HTMLSelectElement).value))}
                            class="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-600">
                        <span>Page {currentPage} of {totalPages}</span>
                        <span class="text-slate-400">|</span>
                        <span>Showing {treeData.length} of {totalRecords} records</span>
                    </div>
                </div>

                <!-- Table Container -->
                <div class="flex-1 overflow-auto">
                    {#if isLoading}
                        <div class="flex items-center justify-center h-64">
                            <div class="flex flex-col items-center gap-3">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span class="text-slate-600">Loading tree data...</span>
                            </div>
                        </div>
                    {:else if treeData.length === 0}
                        <div class="flex items-center justify-center h-64">
                            <div class="text-center">
                                <Database size={48} class="mx-auto mb-3 text-slate-400" />
                                <p class="text-slate-600">No tree data found for this zone</p>
                            </div>
                        </div>
                    {:else}
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-slate-200">
                                <thead class="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Calc ID</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Plot Code</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Tree No</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Species</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">DBH</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Height</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Crown Class</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Quality Class</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Plot X</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Plot Y</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-slate-200">
                                    {#each treeData as record}
                                        <tr class="hover:bg-slate-50">
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.calc_id || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.plot_code || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.tree_no || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                                {record.species_name || record.species_code || '-'}
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.dbh || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.height || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.crown_class || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.quality_class || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.plot_x || '-'}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{record.plot_y || '-'}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>

                <!-- Pagination Controls (Bottom) -->
                {#if totalPages > 1}
                    {@const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4))}
                    {@const endPage = Math.min(totalPages, startPage + 4)}
                    <div class="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
                        <button
                            onclick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || isLoading}
                            class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        
                        <div class="flex items-center gap-2">
                            {#each Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i) as pageNum}
                                <button
                                    onclick={() => handlePageChange(pageNum)}
                                    disabled={isLoading}
                                    class="px-3 py-1 rounded-lg text-sm font-medium transition-colors {
                                        pageNum === currentPage 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                                    } disabled:opacity-50"
                                >
                                    {pageNum}
                                </button>
                            {/each}
                        </div>
                        
                        <button
                            onclick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoading}
                            class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

