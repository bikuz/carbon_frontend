<script lang="ts">
    import { CheckCircle, AlertTriangle, Trash2, Eye, ChevronLeft, ChevronRight, Search, X } from '@lucide/svelte';
    import { onMount } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI, debugComponent, debugPerformance, debugError } from '$lib/utils/debug.js';

    // Props
    let { 
        projectId = $bindable<number>(0),
        onCleaningComplete = $bindable<() => void>(() => {})
    } = $props();

    // State
    let dataSummary = $state({
        totalRecords: 0,
        ignoredRecords: 0
    });
    
    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let cleaningProgress = $state({
        ignoredRecordsRemoved: false
    });

    // Records view state
    let showRecordsView = $state(false);
    let records = $state<any[]>([]);
    let pagination = $state({
        page: 1,
        page_size: 50,
        total_records: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false
    });
    let filters = $state({
        plot_code: '',
        phy_zone: '',
        species_code: '',
        tree_no: ''
    });
    let isLoadingRecords = $state(false);
    let recordsErrorMessage = $state('');
    
    // Physiography options for dropdown
    let physiographyOptions = $state<Array<{code: number, name: string, ecological: string}>>([]);
    let isLoadingPhysiography = $state(false);
    
    // Species options for searchable dropdown
    let speciesOptions = $state<Array<{code: number, species_name: string, species: string, family: string, scientific_name: string, name: string}>>([]);
    let isLoadingSpecies = $state(false);
    let speciesSearchTerm = $state('');
    let showSpeciesDropdown = $state(false);

    // Load data summary when component mounts
    onMount(async () => {
        if (projectId) {
            await loadDataSummary();
        }
        // Load physiography options for dropdown
        await loadPhysiographyOptions();
        // Load species options for dropdown
        await loadSpeciesOptions();
    });

    // Load data summary from API
    async function loadDataSummary() {
        if (!projectId) return;

        const startTime = performance.now();
        isLoading = true;
        errorMessage = '';

        try {
            debug('DataCleaning', 'Loading data summary', { projectId });
            
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_CLEANING_SUMMARY(projectId));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                dataSummary = result.summary;
            } else {
                throw new Error(result.error || 'Failed to load data summary');
            }

            debug('DataCleaning', 'Data summary loaded', dataSummary);

        } catch (error) {
            debugError('DataCleaning', 'Error loading data summary', error);
            errorMessage = 'Failed to load data summary. Please try again.';
        } finally {
            isLoading = false;
            debugPerformance('DataCleaning - loadDataSummary', startTime);
        }
    }

    // Load physiography options from API
    async function loadPhysiographyOptions() {
        const startTime = performance.now();
        isLoadingPhysiography = true;

        try {
            debug('DataCleaning', 'Loading physiography options');
            
            const response = await fetch(API_ENDPOINTS.MRV_PHYSIOGRAPHY_LIST);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                physiographyOptions = result.physiography;
                debug('DataCleaning', 'Physiography options loaded', { count: physiographyOptions.length });
            } else {
                throw new Error(result.error || 'Failed to load physiography options');
            }

        } catch (error) {
            debugError('DataCleaning', 'Error loading physiography options', error);
            // Don't show error message for physiography loading as it's not critical
        } finally {
            isLoadingPhysiography = false;
            debugPerformance('DataCleaning - loadPhysiographyOptions', startTime);
        }
    }

    // Load species options from API
    async function loadSpeciesOptions() {
        const startTime = performance.now();
        isLoadingSpecies = true;

        try {
            debug('DataCleaning', 'Loading species options');
            
            const response = await fetch(API_ENDPOINTS.MRV_FOREST_SPECIES_LIST);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                speciesOptions = result.species;
                debug('DataCleaning', 'Species options loaded', { count: speciesOptions.length });
            } else {
                throw new Error(result.error || 'Failed to load species options');
            }

        } catch (error) {
            debugError('DataCleaning', 'Error loading species options', error);
            // Don't show error message for species loading as it's not critical
        } finally {
            isLoadingSpecies = false;
            debugPerformance('DataCleaning - loadSpeciesOptions', startTime);
        }
    }

    // Remove ignored records
    async function removeIgnoredRecords() {
        if (!projectId) return;

        try {
            debug('DataCleaning', 'Removing ignored records', { projectId, count: dataSummary.ignoredRecords });
            
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_CLEANING_REMOVE_IGNORED(projectId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                cleaningProgress.ignoredRecordsRemoved = true;
                dataSummary.ignoredRecords = 0;
                dataSummary.totalRecords -= result.removed_count;
                
                showMessage(result.message, 'success');
            } else {
                throw new Error(result.error || 'Failed to remove ignored records');
            }
            debug('DataCleaning', 'Ignored records removed successfully');

        } catch (error) {
            debugError('DataCleaning', 'Error removing ignored records', error);
            showMessage('Failed to remove ignored records', 'error');
        }
    }



    // Check if all cleaning actions are completed
    $effect(() => {
        const allCompleted = Object.values(cleaningProgress).every(completed => completed);
        if (allCompleted && onCleaningComplete) {
            debug('DataCleaning', 'All cleaning actions completed, notifying parent');
            onCleaningComplete();
        }
    });

    // Load records with filters and pagination
    async function loadRecords(page: number = 1) {
        if (!projectId) return;

        const startTime = performance.now();
        isLoadingRecords = true;
        recordsErrorMessage = '';

        try {
            debug('DataCleaning', 'Loading records', { projectId, page, filters });
            
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_CLEANING_VIEW_RECORDS(projectId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters,
                    page,
                    page_size: pagination.page_size
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                records = result.records;
                pagination = result.pagination;
                debug('DataCleaning', 'Records loaded successfully', { 
                    count: records.length, 
                    pagination 
                });
            } else {
                throw new Error(result.error || 'Failed to load records');
            }

        } catch (error) {
            debugError('DataCleaning', 'Error loading records', error);
            recordsErrorMessage = 'Failed to load records. Please try again.';
        } finally {
            isLoadingRecords = false;
            debugPerformance('DataCleaning - loadRecords', startTime);
        }
    }

    // Handle filter changes
    function handleFilterChange(filterName: keyof typeof filters, value: string) {
        filters[filterName] = value;
        // Reset to first page when filters change
        pagination.page = 1;
    }

    // Apply filters and reload records
    async function applyFilters() {
        await loadRecords(1);
    }

    // Clear all filters
    function clearFilters() {
        filters = {
            plot_code: '',
            phy_zone: '',
            species_code: '',
            tree_no: ''
        };
        speciesSearchTerm = '';
        pagination.page = 1;
    }

    // Navigate to specific page
    async function goToPage(page: number) {
        if (page >= 1 && page <= pagination.total_pages) {
            await loadRecords(page);
        }
    }

    // Toggle records view
    async function toggleRecordsView() {
        showRecordsView = !showRecordsView;
        if (showRecordsView && records.length === 0) {
            await loadRecords(1);
        }
    }

    // Get page numbers for pagination
    function getPageNumbers(): number[] {
        const totalPages = pagination.total_pages;
        const currentPage = pagination.page;
        
        if (totalPages <= 5) {
            return Array.from({length: totalPages}, (_, i) => i + 1);
        }
        
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        
        return Array.from({length: end - start + 1}, (_, i) => start + i);
    }

    // Show message and auto-hide
    function showMessage(message: string, type: 'success' | 'error') {
        if (type === 'success') {
            successMessage = message;
            errorMessage = '';
        } else {
            errorMessage = message;
            successMessage = '';
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (type === 'success') {
                successMessage = '';
            } else {
                errorMessage = '';
            }
        }, 5000);
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }

    // Get filtered species options based on search term
    function getFilteredSpeciesOptions() {
        if (!speciesSearchTerm.trim()) {
            return speciesOptions.slice(0, 10); // Show first 10 if no search
        }
        
        const filtered = speciesOptions.filter(species => 
            species.species_name.toLowerCase().includes(speciesSearchTerm.toLowerCase()) ||
            species.scientific_name.toLowerCase().includes(speciesSearchTerm.toLowerCase()) ||
            species.name.toLowerCase().includes(speciesSearchTerm.toLowerCase()) ||
            species.code.toString().includes(speciesSearchTerm)
        );
        
        return filtered.slice(0, 10); // Limit to 10 results
    }

    // Handle species selection
    function selectSpecies(species: typeof speciesOptions[0]) {
        filters.species_code = species.code.toString();
        speciesSearchTerm = `${species.code} - ${species.species_name}`;
        showSpeciesDropdown = false;
        // Reset to first page when filters change
        pagination.page = 1;
    }

    // Handle species search input
    function handleSpeciesSearch(value: string) {
        speciesSearchTerm = value;
        showSpeciesDropdown = true;
        
        // If user clears the search, also clear the filter
        if (!value.trim()) {
            filters.species_code = '';
        }
    }

    // Close species dropdown when clicking outside
    function handleSpeciesDropdownBlur() {
        setTimeout(() => {
            showSpeciesDropdown = false;
        }, 200);
    }


</script>

<div class="space-y-6">
    <div>
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Data Cleaning & Final Preparation</h2>
        <p class="text-slate-600 mb-6">
            Final data preparation and cleaning before proceeding to height-diameter modeling.
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

    {#if isLoading && !dataSummary.totalRecords}
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p class="text-slate-600 mt-2">Loading data summary...</p>
        </div>
    {:else}
        <!-- Data Cleaning Options -->
        <div class="space-y-6">
            <!-- Cleaning Actions -->
            <div class="bg-white border border-slate-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Data Cleaning Actions</h3>
                <div class="space-y-4">
                                         <!-- Remove Ignored Records -->
                     <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                         <div class="flex items-center gap-3">
                             <div class="p-2 bg-red-100 rounded-lg">
                                 <Trash2 size={16} class="text-red-600" />
                             </div>
                             <div>
                                 <h4 class="font-medium text-slate-900">Remove Ignored Records</h4>
                                 <p class="text-sm text-slate-600">Permanently remove records marked as ignored during quality checks</p>
                             </div>
                         </div>
                         <div class="flex items-center gap-3">
                             {#if cleaningProgress.ignoredRecordsRemoved}
                                 <span class="text-emerald-600 text-sm font-medium">✓ Completed</span>
                             {:else}
                                 <span class="text-slate-500 text-sm">{formatNumber(dataSummary.ignoredRecords)} records</span>
                                 <button 
                                     onclick={removeIgnoredRecords}
                                     disabled={dataSummary.ignoredRecords === 0}
                                     class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     Remove
                                 </button>
                             {/if}
                         </div>
                     </div>

                     <!-- View All Records -->
                     <div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                         <div class="flex items-center gap-3">
                             <div class="p-2 bg-blue-100 rounded-lg">
                                 <Eye size={16} class="text-blue-600" />
                             </div>
                             <div>
                                 <h4 class="font-medium text-slate-900">View All Records</h4>
                                 <p class="text-sm text-slate-600">Browse and filter all valid records in the dataset</p>
                             </div>
                         </div>
                         <div class="flex items-center gap-3">
                             <span class="text-slate-500 text-sm">{formatNumber(dataSummary.totalRecords - dataSummary.ignoredRecords)} records</span>
                             <button 
                                 onclick={toggleRecordsView}
                                 class="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                             >
                                 {showRecordsView ? 'Hide Records' : 'Show Records'}
                             </button>
                         </div>
                     </div>


                                 </div>
             </div>

             <!-- Records View -->
             {#if showRecordsView}
                 <div class="bg-white border border-slate-200 rounded-lg p-6">
                     <div class="flex items-center justify-between mb-6">
                         <h3 class="text-lg font-semibold text-slate-900">Records View</h3>
                         <button 
                             onclick={toggleRecordsView}
                             class="text-slate-500 hover:text-slate-700"
                         >
                             <X size={20} />
                         </button>
                     </div>

                     <!-- Filters -->
                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                         <!-- Plot Code Filter -->
                         <div>
                             <label class="block text-sm font-medium text-slate-700 mb-2">Plot Code</label>
                             <input
                                 type="text"
                                 bind:value={filters.plot_code}
                                 oninput={() => handleFilterChange('plot_code', filters.plot_code)}
                                 placeholder="Enter plot code..."
                                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             />
                         </div>

                                                   <!-- Physiography Zone Filter -->
                          <div>
                              <label class="block text-sm font-medium text-slate-700 mb-2">Physiography Zone</label>
                              <select
                                  bind:value={filters.phy_zone}
                                  onchange={() => handleFilterChange('phy_zone', filters.phy_zone)}
                                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                  <option value="">All Zones</option>
                                  {#if isLoadingPhysiography}
                                      <option disabled>Loading...</option>
                                  {:else if physiographyOptions.length > 0}
                                      {#each physiographyOptions as zone}
                                          <option value={zone.code}>{zone.code} - {zone.name}</option>
                                      {/each}
                                  {:else}
                                      <option disabled>No zones available</option>
                                  {/if}
                              </select>
                          </div>

                                                   <!-- Species Code Filter -->
                          <div class="relative">
                              <label class="block text-sm font-medium text-slate-700 mb-2">Species</label>
                              <div class="relative">
                                  <input
                                      type="text"
                                      bind:value={speciesSearchTerm}
                                      oninput={() => handleSpeciesSearch(speciesSearchTerm)}
                                      onfocus={() => showSpeciesDropdown = true}
                                      onblur={handleSpeciesDropdownBlur}
                                      placeholder="Search species by code, name, or scientific name..."
                                      class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {#if isLoadingSpecies}
                                      <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                      </div>
                                  {/if}
                                  
                                  <!-- Dropdown -->
                                  {#if showSpeciesDropdown && (speciesOptions.length > 0 || speciesSearchTerm.trim())}
                                      <div class="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                          {#if isLoadingSpecies}
                                              <div class="px-3 py-2 text-sm text-slate-500">Loading species...</div>
                                          {:else if getFilteredSpeciesOptions().length === 0}
                                              <div class="px-3 py-2 text-sm text-slate-500">No species found</div>
                                          {:else}
                                              {#each getFilteredSpeciesOptions() as species}
                                                  <button
                                                      type="button"
                                                      onclick={() => selectSpecies(species)}
                                                      class="w-full px-3 py-2 text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                                                  >
                                                      <div class="font-medium text-slate-900">{species.code} - {species.species_name}</div>
                                                      <div class="text-xs text-slate-600">{species.scientific_name}</div>
                                                      <div class="text-xs text-slate-500">{species.family}</div>
                                                  </button>
                                              {/each}
                                          {/if}
                                      </div>
                                  {/if}
                              </div>
                          </div>

                         <!-- Tree Number Filter -->
                         <div>
                             <label class="block text-sm font-medium text-slate-700 mb-2">Tree Number</label>
                             <input
                                 type="text"
                                 bind:value={filters.tree_no}
                                 oninput={() => handleFilterChange('tree_no', filters.tree_no)}
                                 placeholder="Enter tree number..."
                                 class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             />
                         </div>
                     </div>

                     <!-- Filter Actions -->
                     <div class="flex items-center gap-3 mb-6">
                         <button
                             onclick={applyFilters}
                             class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                         >
                             Apply Filters
                         </button>
                         <button
                             onclick={clearFilters}
                             class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                         >
                             Clear Filters
                         </button>
                     </div>

                     <!-- Error Message -->
                     {#if recordsErrorMessage}
                         <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                             <div class="flex items-center gap-2 text-red-700">
                                 <AlertTriangle size={20} />
                                 <span class="font-medium">Error</span>
                             </div>
                             <p class="text-red-600 mt-1">{recordsErrorMessage}</p>
                         </div>
                     {/if}

                     <!-- Records Table -->
                     {#if isLoadingRecords}
                         <div class="text-center py-8">
                             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                             <p class="text-slate-600 mt-2">Loading records...</p>
                         </div>
                     {:else if records.length > 0}
                         <div class="overflow-x-auto">
                             <table class="min-w-full divide-y divide-slate-200">
                                 <thead class="bg-slate-50">
                                     <tr>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plot Code</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tree No</th>
                                                                                   <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Code</th>
                                          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Name</th>
                                          <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DBH (cm)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Height (m)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zone</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quality</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Crown Class</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Base Height (m)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Crown Height (m)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Base Crown (m)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Slope (°)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Age (yrs)</th>
                                         <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Radial Growth</th>
                                     </tr>
                                 </thead>
                                                                      <tbody class="bg-white divide-y divide-slate-200">
                                         {#each records as record}
                                             <tr class="hover:bg-slate-50">
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.plot_code || 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.tree_no || 'N/A'}</td>
                                                                                                   <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.species_code || 'N/A'}</td>
                                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.species_name || 'N/A'}</td>
                                                  <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.dbh ? `${record.dbh.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.height ? `${record.height.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.quality_class || 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.crown_class || 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.base_tree_height ? `${record.base_tree_height.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.crown_height ? `${record.crown_height.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.base_crown_height ? `${record.base_crown_height.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.base_slope ? `${record.base_slope.toFixed(1)}` : 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.age || 'N/A'}</td>
                                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{record.radial_growth || 'N/A'}</td>
                                             </tr>
                                         {/each}
                                     </tbody>
                             </table>
                         </div>

                         <!-- Pagination -->
                         <div class="flex items-center justify-between mt-6">
                             <div class="text-sm text-slate-700">
                                 Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_records)} of {pagination.total_records} records
                             </div>
                             <div class="flex items-center gap-2">
                                 <button
                                     onclick={() => goToPage(pagination.page - 1)}
                                     disabled={!pagination.has_previous}
                                     class="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                 >
                                     <ChevronLeft size={16} />
                                 </button>
                                 
                                 {#each getPageNumbers() as pageNum}
                                     <button
                                         onclick={() => goToPage(pageNum)}
                                         class="px-3 py-2 border rounded-lg transition-colors {pageNum === pagination.page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}"
                                     >
                                         {pageNum}
                                     </button>
                                 {/each}
                                 
                                 <button
                                     onclick={() => goToPage(pagination.page + 1)}
                                     disabled={!pagination.has_next}
                                     class="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                 >
                                     <ChevronRight size={16} />
                                 </button>
                             </div>
                         </div>
                     {:else if !isLoadingRecords}
                         <div class="text-center py-8">
                             <p class="text-slate-500">No records found matching the current filters.</p>
                         </div>
                     {/if}
                 </div>
             {/if}

             <!-- Final Validation -->
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <div class="flex items-center gap-3 mb-4">
                    <CheckCircle class="h-6 w-6 text-emerald-600" />
                    <h3 class="text-lg font-semibold text-emerald-900">Data Ready for Analysis</h3>
                </div>
                <p class="text-emerald-700 mb-4">
                    Your forest measurement data has been cleaned and is ready for height-diameter modeling analysis.
                </p>
                <div class="text-sm text-emerald-600 space-y-1 mb-6">
                    <div class="flex items-center gap-2">
                        {#if cleaningProgress.ignoredRecordsRemoved}
                            <CheckCircle size={14} class="text-emerald-600" />
                        {:else}
                            <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                        {/if}
                        Ignored records removed
                    </div>
                    <div class="flex items-center gap-2">
                        {#if cleaningProgress.ignoredRecordsRemoved}
                            <CheckCircle size={14} class="text-emerald-600" />
                        {:else}
                            <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                        {/if}
                        Data ready for analysis
                    </div>
                </div>
                
                
            </div>
        </div>
    {/if}
</div>
