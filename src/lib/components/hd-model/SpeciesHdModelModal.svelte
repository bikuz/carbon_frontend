<script lang="ts">
  import { TreePine, CheckCircle, AlertTriangle } from '@lucide/svelte';
  
  // Props
  interface Props {
    showModal: boolean;
    selectedPhyZone: number;
    selectedPhyZoneData: any;
    unassignedRecords: any[];
    hdModels: any[];
    isLoadingUnassignedRecords: boolean;
    isLoadingHdModels: boolean;
    saveSummary: any;
    pageSize: number;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    isSaving: boolean;
    onclose: () => void;
    onpageSizeChange: (pageSize: number) => void;
    onloadPage: (page: number) => void;
    onsaveAllChanges: () => void;
  }
  
  let {
    showModal,
    selectedPhyZone,
    selectedPhyZoneData,
    unassignedRecords,
    hdModels,
    isLoadingUnassignedRecords,
    isLoadingHdModels,
    saveSummary,
    pageSize,
    currentPage,
    totalPages,
    totalRecords,
    isSaving,
    onclose,
    onpageSizeChange,
    onloadPage,
    onsaveAllChanges
  }: Props = $props();
  
  // Function to calculate page numbers for pagination
  function getPageNumbers(): number[] {
    const pages: number[] = [];
    
    if (totalPages <= 5) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      for (let i = totalPages - 4; i <= totalPages; i++) {
        if (i >= 1 && i <= totalPages) pages.push(i);
      }
    } else {
      // Show pages around current page
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i >= 1 && i <= totalPages) pages.push(i);
      }
    }
    return pages;
  }
  
</script>

<!-- Species-HD Model Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-6xl mx-4 max-h-[90vh] overflow-hidden" data-modal="species-hd-model">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TreePine class="h-5 w-5 text-emerald-600" />
          Update Species-HD Model for {selectedPhyZoneData?.physiography_name || selectedPhyZone}
        </h3>
        <button 
          onclick={onclose}
          class="p-2 hover:bg-slate-100 rounded-lg"
        >
          <span class="sr-only">Close</span>
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      {#if isLoadingUnassignedRecords || isLoadingHdModels}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span class="ml-2 text-slate-600">
            {isLoadingUnassignedRecords ? 'Loading unassigned records...' : 'Loading HD models...'}
          </span>
        </div>
      {:else if totalRecords > 0}
        <!-- Save Results Summary -->
        {#if saveSummary}
          <div class="mb-4 p-4 border rounded-lg {
            saveSummary.errors === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }">
            <div class="flex items-center gap-2 mb-2">
              {#if saveSummary.errors === 0}
                <CheckCircle class="h-5 w-5 text-green-600" />
                <span class="font-medium text-green-800">Save Completed Successfully</span>
              {:else}
                <AlertTriangle class="h-5 w-5 text-amber-600" />
                <span class="font-medium text-amber-800">Save Completed with Errors</span>
              {/if}
            </div>
            <div class="text-sm text-slate-700">
              <p>Total: {saveSummary.total} | Successful: {saveSummary.successful} | Errors: {saveSummary.errors}</p>
              {#if saveSummary.errors > 0}
                <p class="mt-1 text-amber-700">Please review and fix the errors below, then save again.</p>
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- Page Size Selector -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <label for="pageSize" class="text-sm font-medium text-slate-700">Show:</label>
            <select 
              id="pageSize"
              bind:value={pageSize}
              onchange={() => onpageSizeChange(pageSize)}
              class="pl-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
            <span class="text-sm text-slate-600">records per page</span>
          </div>
        </div>
        
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Species Code</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Species Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">HD Model</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">a</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">b</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">c</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Status</th>
                </tr>
              </thead>
            </table>
          </div>
          
          <!-- Scrollable table body with fixed height -->
          <div class="max-h-96 overflow-y-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <tbody class="bg-white divide-y divide-slate-200">
                {#if unassignedRecords.length > 0}
                  {#each unassignedRecords as record, index}
                    <tr class="hover:bg-slate-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 w-24">{record.species_code}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 w-48">{record.species_name}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-40">
                        <select 
                          bind:value={record.model_name}
                          class="w-full pl-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select HD Model</option>
                          {#if hdModels.length > 0}
                            {#each hdModels as hdModel}
                              <option value={hdModel.code}>{hdModel.code}-{hdModel.name}</option>
                            {/each}
                          {:else}
                            <option value="" disabled>No HD models available</option>
                          {/if}
                        </select>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                        <input 
                          type="number" 
                          step="0.001"
                          bind:value={record.hd_a}
                          class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                          placeholder="a"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                        <input 
                          type="number" 
                          step="0.001"
                          bind:value={record.hd_b}
                          class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                          placeholder="b"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                        <input 
                          type="number" 
                          step="0.001"
                          bind:value={record.hd_c}
                          class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                          placeholder="c"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm w-48">
                        {#if record.status}
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-1 text-xs rounded-full font-medium {
                              record.status === 'created' ? 'bg-green-100 text-green-800' :
                              record.status === 'updated' ? 'bg-blue-100 text-blue-800' :
                              record.status === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-800'
                            }">
                              {record.status}
                            </span>
                            <span class="text-xs text-slate-600" title={record.message}>
                              {record.message}
                            </span>
                          </div>
                        {:else}
                          <span class="text-slate-400 text-xs">Not saved</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                      No records on this page. Use pagination to navigate to other pages.
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination Controls -->
        {#if totalPages > 1 && pageSize !== -1 && totalRecords > 0}
          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div class="flex items-center gap-2">
              <button 
                onclick={() => onloadPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingUnassignedRecords}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {#each getPageNumbers() as pageNum}
                <button 
                  onclick={() => onloadPage(pageNum)}
                  disabled={pageNum === currentPage || isLoadingUnassignedRecords}
                  class="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed {
                    pageNum === currentPage 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }"
                >
                  {pageNum}
                </button>
              {/each}
              
              <button 
                onclick={() => onloadPage(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoadingUnassignedRecords}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        {:else if pageSize === -1 && totalRecords > 0}
          <div class="mt-4 text-center text-sm text-slate-600">
            Showing all {totalRecords} records
          </div>
        {:else if totalPages === 1 && totalRecords > 0}
          <div class="mt-4 text-center text-sm text-slate-600">
            Showing {totalRecords} record{totalRecords !== 1 ? 's' : ''}
          </div>
        {/if}
      {:else}
        <div class="text-center py-8 text-slate-500">
          <CheckCircle class="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p>All HD models have been assigned for this zone!</p>
        </div>
      {/if}
      
      <!-- Save Changes Button -->
      {#if unassignedRecords.some(record => record.model_name || record.hd_a || record.hd_b || record.hd_c)}
        <div class="mt-6 flex justify-end gap-3">
          <button 
            onclick={onclose}
            class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Close
          </button>
          <button 
            onclick={onsaveAllChanges}
            disabled={isSaving}
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {#if isSaving}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      {:else}
        <div class="mt-6 flex justify-end">
          <button 
            onclick={onclose}
            class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
