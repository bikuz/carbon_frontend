<script lang="ts">
  import { TreePine, CheckCircle, AlertTriangle, Database } from '@lucide/svelte';
  
  // Props
  interface Props {
    showModal: boolean;
    selectedPhyZone: number;
    selectedPhyZoneData: any;
    unassignedSpecies: any[];
    allometricModels: any[];
    isLoadingUnassignedSpecies: boolean;
    isLoadingAllometricModels: boolean;
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
    unassignedSpecies,
    allometricModels,
    isLoadingUnassignedSpecies,
    isLoadingAllometricModels,
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
  
  // Filter state
  let speciesFilter = $state('');
  let filteredSpecies: any[] = $state([]);
  let showDropdown = $state(false);
  let selectedSpecies: any = $state(null);
  let dropdownOptions: any[] = $state([]);
  
  // Create dropdown options from unassigned species (grouped by genus)
  $effect(() => {
    // Group species by genus (first part of species name)
    const genusGroups = new Map();
    
    unassignedSpecies.forEach(species => {
      if (species.species) {
        const genus = species.species.split(' ')[0]; // Get first word (genus)
        if (!genusGroups.has(genus)) {
          genusGroups.set(genus, []);
        }
        genusGroups.get(genus).push(species);
      }
    });
    
    // Create dropdown options for each unique genus
    dropdownOptions = Array.from(genusGroups.entries()).map(([genus, speciesList]) => ({
      value: genus,
      label: genus,
      genus: genus,
      speciesList: speciesList,
      totalTrees: speciesList.reduce((sum: number, s: any) => sum + (s.tree_count || 0), 0)
    }));
  });
  
  // Filter dropdown options based on search term
  $effect(() => {
    if (!speciesFilter.trim()) {
      filteredSpecies = unassignedSpecies;
      showDropdown = false;
    } else {
      const filterLower = speciesFilter.toLowerCase();
      const filteredOptions = dropdownOptions.filter(option => 
        option.genus.toLowerCase().includes(filterLower)
      );
      
      // Show dropdown if there are matching options
      showDropdown = filteredOptions.length > 0;
      
      // If a specific genus is selected, show all species in that genus
      if (selectedSpecies) {
        filteredSpecies = selectedSpecies.speciesList || [];
      } else {
        // Show all species that match the filter (only using genus)
        filteredSpecies = unassignedSpecies.filter(species => 
          species.species && species.species.toLowerCase().includes(filterLower)
        );
      }
    }
  });
  
  // Reset filter when modal opens/closes
  $effect(() => {
    if (showModal) {
      speciesFilter = '';
      filteredSpecies = unassignedSpecies;
      selectedSpecies = null;
      showDropdown = false;
    }
  });
  
  // Handle genus selection from dropdown
  function selectSpecies(option: any) {
    selectedSpecies = option;
    speciesFilter = option.genus;
    showDropdown = false;
  }
  
  // Clear selection
  function clearSelection() {
    selectedSpecies = null;
    speciesFilter = '';
    showDropdown = false;
  }
  
  // Handle input focus
  function handleInputFocus() {
    if (speciesFilter.trim()) {
      showDropdown = true;
    }
  }
  
  // Handle input blur (with delay to allow click on dropdown)
  function handleInputBlur() {
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }
  
</script>

<!-- Allometric Assignment Modal -->
{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-6xl mx-4 max-h-[90vh] overflow-hidden" data-modal="allometric-assignment">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Database class="h-5 w-5 text-emerald-600" />
          Assign Allometric Equations for {selectedPhyZoneData?.physiography_name || selectedPhyZone}
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
      
      <!-- Species Filter -->
      {#if unassignedSpecies.length > 0}
        <div class="mb-4">
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <label for="species-filter" class="block text-sm font-medium text-slate-700 mb-1">
                Filter Species
              </label>
              <div class="relative">
                <input
                  id="species-filter"
                  type="text"
                  bind:value={speciesFilter}
                  onfocus={handleInputFocus}
                  onblur={handleInputBlur}
                  placeholder="Search by genus/species..."
                  class="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                {#if speciesFilter.trim()}
                  <button
                    onclick={clearSelection}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                    title="Clear filter"
                    aria-label="Clear filter"
                  >
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                {/if}
                
                <!-- Dropdown List -->
                {#if showDropdown && dropdownOptions.length > 0}
                  <div class="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {#each dropdownOptions.filter(option => 
                      option.genus.toLowerCase().includes(speciesFilter.toLowerCase())
                    ) as option}
                      <button
                        onclick={() => selectSpecies(option)}
                        class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none border-b border-slate-100 last:border-b-0"
                      >
                        <div class="flex justify-between items-center">
                          <div class="flex-1">
                            <div class="font-medium text-slate-900">{option.genus}</div>
                            <div class="text-xs text-slate-500">{option.speciesList.length} species</div>
                          </div>
                          {#if option.totalTrees}
                            <div class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {option.totalTrees} trees
                            </div>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            <div class="text-sm text-slate-600 mt-6">
              {#if selectedSpecies}
                Showing {selectedSpecies.speciesList?.length || 0} species in genus "{selectedSpecies.genus}" ({selectedSpecies.totalTrees || 0} trees)
              {:else if speciesFilter.trim()}
                Showing {filteredSpecies.length} of {unassignedSpecies.length} species
              {:else}
                {unassignedSpecies.length} species total
              {/if}
            </div>
          </div>
        </div>
      {/if}
      
      {#if isLoadingUnassignedSpecies || isLoadingAllometricModels}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span class="ml-2 text-slate-600">
            {isLoadingUnassignedSpecies ? 'Loading unassigned species...' : 'Loading allometric models...'}
          </span>
        </div>
      {:else if unassignedSpecies.length > 0}
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
              {#if saveSummary.updatedTreesCount > 0}
                <p class="mt-1 text-blue-700">Updated {saveSummary.updatedTreesCount} tree records with vol_eqn_id.</p>
              {/if}
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
          <div class="overflow-x-auto max-h-96 overflow-y-auto">
            <table class="min-w-full divide-y divide-slate-200" style="min-width: 2400px; table-layout: auto;">
              <thead class="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style="width: 80px; min-width: 80px; max-width: 80px;">Species Code</th>
                  <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style="min-width: 150px;">Species Name</th>
                  <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style="min-width: 150px;">Species</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Density</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Stem A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Stem B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Stem C</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Top 10 A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Top 10 B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Top 20 A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Top 20 B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Stem A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Stem B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Top 10 A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Top 10 B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Top 20 A</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Bark Top 20 B</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Branch S</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Branch M</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Branch L</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Foliage S</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Foliage M</th>
                  <th class="px-2 py-3 text-center text-xs font-medium text-slate-500 tracking-wider" style="width: 100px; min-width: 100px; max-width: 100px;">Foliage L</th>
                  <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" style="width: 120px; min-width: 120px; max-width: 120px;">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-slate-200">
                {#each filteredSpecies as species, index}
                  <tr class="hover:bg-slate-50">
                    <td class="px-2 py-4 whitespace-nowrap text-sm font-medium text-slate-900" style="width: 80px; min-width: 80px; max-width: 80px;">{species.species_code}</td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm font-medium text-slate-900" style="min-width: 150px;">{species.species_name}</td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm font-medium text-slate-900" style="min-width: 150px;">{species.species}</td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.density}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.stem_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.stem_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.stem_c}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.top_10_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.top_10_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.top_20_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.top_20_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_stem_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_stem_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_top_10_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_top_10_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_top_20_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.bark_top_20_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.branch_s}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.branch_m}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.branch_l}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.foliage_s}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.foliage_m}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm text-slate-500" style="width: 100px; min-width: 100px; max-width: 100px;">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={species.foliage_l}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="0.000"
                      />
                    </td>
                    <td class="px-2 py-4 whitespace-nowrap text-sm" style="width: 120px; min-width: 120px; max-width: 120px;">
                      {#if species.status}
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-1 text-xs rounded-full font-medium {
                            species.status === 'created' ? 'bg-green-100 text-green-800' :
                            species.status === 'updated' ? 'bg-blue-100 text-blue-800' :
                            species.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }">
                            {species.status}
                          </span>
                          <span class="text-xs text-slate-600" title={species.message}>
                            {species.message}
                          </span>
                        </div>
                      {:else}
                        <span class="text-slate-400 text-xs">Not saved</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination Controls -->
        {#if totalPages > 1 && pageSize !== -1}
          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div class="flex items-center gap-2">
              <button 
                onclick={() => onloadPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingUnassignedSpecies}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return pageNum;
                } else if (currentPage <= 3) {
                  return pageNum;
                } else if (currentPage >= totalPages - 2) {
                  return totalPages - 4 + pageNum;
                } else {
                  return currentPage - 2 + pageNum;
                }
              }) as pageNum}
                <button 
                  onclick={() => onloadPage(pageNum)}
                  disabled={pageNum === currentPage || isLoadingUnassignedSpecies}
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
                disabled={currentPage === totalPages || isLoadingUnassignedSpecies}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="mt-6 flex items-center justify-end gap-3">
          <button 
            onclick={onclose}
            class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cancel
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
              <Database class="h-4 w-4" />
              Save All Changes
            {/if}
          </button>
        </div>
      {:else if unassignedSpecies.length === 0}
        <div class="text-center py-8 text-slate-500">
          <Database class="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <p class="text-lg font-medium">No unassigned species found</p>
          <p class="text-sm">All species in this zone already have allometric equations assigned.</p>
        </div>
      {:else if filteredSpecies.length === 0}
        <div class="text-center py-8 text-slate-500">
          <Database class="h-12 w-12 mx-auto mb-3 text-slate-400" />
          <p class="text-lg font-medium">No species match your filter</p>
          <p class="text-sm">Try searching by genus/species name or select from the dropdown to find the species you're looking for.</p>
          <button 
            onclick={clearSelection}
            class="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            Clear Filter
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
