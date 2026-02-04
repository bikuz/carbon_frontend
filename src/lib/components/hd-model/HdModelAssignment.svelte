<script lang="ts">
    import { TreePine, AlertTriangle, Database, CheckCircle } from '@lucide/svelte';
    import SpeciesHdModelModal from './SpeciesHdModelModal.svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    import { onMount, onDestroy } from 'svelte';
    
    // Props
    interface Props {
        currentProjectId: number;
        physiographyZones: any[];
        isLoadingPhysiographyData: boolean;
        isAssigningModels: boolean;
        modelsAssignedSuccessfully: boolean;
        isLoadingUnassignedRecords: boolean;
        onloadPhysiographyZoneData: () => void;
        onassignModelsForZone: (event: CustomEvent<number>) => void;
        onshowZoneData: (event: CustomEvent<number>) => void;
    }
    
    let {
        currentProjectId,
        physiographyZones,
        isLoadingPhysiographyData,
        isAssigningModels,
        modelsAssignedSuccessfully,
        isLoadingUnassignedRecords,
        onloadPhysiographyZoneData,
        onassignModelsForZone,
        onshowZoneData
    }: Props = $props();
    
    // Modal state
    let showSpeciesHdModelModal = $state(false);
    let selectedPhyZone = $state(0);
    let selectedPhyZoneData: any = $state(null);
    
    // Modal data
    let unassignedRecords: any[] = $state([]);
    let hdModels: any[] = $state([]);
    let isLoadingUnassignedRecordsModal = $state(false);
    let isLoadingHdModels = $state(false);
    let saveSummary: any = $state(null);
    let pageSize = $state(20);
    let currentPage = $state(1);
    let totalPages = $state(1);
    let totalRecords = $state(0);
    let isSaving = $state(false);
    
    // Functions for modal
    function openSpeciesHdModelModal(zone: any) {
        selectedPhyZone = zone.phy_zone;
        selectedPhyZoneData = zone;
        showSpeciesHdModelModal = true;
        // Reset pagination when opening modal
        currentPage = 1;
        debug('Opening modal for zone:', zone.phy_zone, 'Modal visible:', showSpeciesHdModelModal);
        loadUnassignedRecords();
        loadHdModels();
    }
    
    function closeSpeciesHdModelModal() {
        showSpeciesHdModelModal = false;
        selectedPhyZone = 0;
        selectedPhyZoneData = null;
        unassignedRecords = [];
        saveSummary = null;
    }
    
    function handlePageSizeChange(newPageSize: number) {
        pageSize = newPageSize;
        currentPage = 1;
        loadUnassignedRecords();
    }
    
    function loadPage(page: number) {
        currentPage = page;
        loadUnassignedRecords();
    }
    
    async function loadUnassignedRecords() {
        if (!currentProjectId || !selectedPhyZone) return;
        
        // Clear previous save results
        saveSummary = null;
        
        isLoadingUnassignedRecordsModal = true;
        
        // Load HD models if not already loaded
        await loadHdModels();
        
        try {
            // Handle "All" option - use a very large number to get all records
            const effectivePageSize = pageSize === -1 ? 10000 : pageSize;
            
            // Use the new dedicated API endpoint for unassigned HD model records
            const url = `${API_ENDPOINTS.MRV_PROJECT_HD_MODEL_UNASSIGNED_RECORDS(currentProjectId)}?phy_zone=${selectedPhyZone}&page=${currentPage}&page_size=${effectivePageSize}`;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    // Handle empty records array
                    if (data.records && data.records.length > 0) {
                        // Transform the data to match the table structure
                        unassignedRecords = data.records.map((record: any) => ({
                            species_code: record.species_code,
                            species_name: record.species_name,
                            model_name: '', // This will store the HD model code
                            hd_a: '',
                            hd_b: '',
                            hd_c: ''
                        }));
                    } else {
                        unassignedRecords = [];
                    }
                    
                    // Update pagination info - use total_records from API if available
                    totalRecords = data.total_records ?? 0;
                    
                    // Calculate total pages correctly
                    if (totalRecords === 0) {
                        totalPages = 0;
                    } else if (pageSize === -1) {
                        totalPages = 1;
                    } else {
                        totalPages = Math.ceil(totalRecords / pageSize);
                    }
                    
                    // If current page is beyond total pages, reset to last valid page
                    if (totalPages > 0 && currentPage > totalPages) {
                        currentPage = totalPages;
                        // Note: The caller should reload after this adjustment
                    }
                    
                    debug('Loaded unassigned records:', {
                        records: unassignedRecords,
                        totalRecords,
                        totalPages,
                        currentPage,
                        pageSize: effectivePageSize,
                        apiResponse: data
                    });
                }
            } else {
                debug('Failed to load unassigned records:', response.status);
                const errorData = await response.json().catch(() => ({}));
                debug('Error response data:', errorData);
            }
        } catch (error) {
            debug('Error loading unassigned records:', error);
        } finally {
            isLoadingUnassignedRecordsModal = false;
        }
    }
    
    async function loadHdModels() {
        if (hdModels.length > 0) return; // Already loaded
        
        isLoadingHdModels = true;
        try {
            const url = API_ENDPOINTS.MRV_HD_MODEL_LIST;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.hd_models) {
                    hdModels = data.hd_models;
                    debug('HD models loaded:', hdModels);
                } else {
                    debug('Failed to load HD models:', data.error);
                }
            } else {
                debug('Failed to load HD models:', response.status);
            }
        } catch (error) {
            debug('Error loading HD models:', error);
        } finally {
            isLoadingHdModels = false;
        }
    }
    
    async function saveAllChanges() {
        if (!currentProjectId || !selectedPhyZone) return;
        
        // Filter records that have complete data (HD model + required parameters a and b)
        const recordsToUpdate = unassignedRecords.filter(record => {
            const hasModel = record.model_name && record.model_name !== '';
            const hasA = record.hd_a !== null && record.hd_a !== undefined && record.hd_a !== '';
            const hasB = record.hd_b !== null && record.hd_b !== undefined && record.hd_b !== '';
            
            // Only include records that have HD model AND both a and b parameters
            return hasModel && hasA && hasB;
        });
        
        if (recordsToUpdate.length === 0) {
            alert('No complete records to save. Please select an HD model and enter values for parameters a and b for at least one record.');
            return;
        }
        
        debug('Saving changes for records:', recordsToUpdate);
        
        isSaving = true;
        try {
            // Prepare mappings data for API
            const mappings = recordsToUpdate.map(record => ({
                species_code: record.species_code,
                hd_model_code: record.model_name,
                hd_a: parseFloat(record.hd_a) || 0,
                hd_b: parseFloat(record.hd_b) || 0,
                hd_c: record.hd_c ? parseFloat(record.hd_c) : null,
                phy_zone: selectedPhyZone
            }));
            
            const url = API_ENDPOINTS.MRV_PROJECT_HD_MODEL_UPDATE_SPECIES_MAPPING(currentProjectId);
            const requestData = { mappings };
            debugAPI('POST', url, requestData, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('Species-HD model mappings updated successfully:', data);
                    
                    // Store results for display
                    const saveResults = data.results || [];
                    saveSummary = data.summary || {};
                    
                    // Update the unassignedRecords with status information
                    unassignedRecords = unassignedRecords.map(record => {
                        const result = saveResults.find((r:any) => 
                            r.species_code === record.species_code && 
                            r.phy_zone === selectedPhyZone
                        );
                        
                        if (result) {
                            return {
                                ...record,
                                status: result.status,
                                message: result.message
                            };
                        }
                        return record;
                    });
                    
                    // Show success message
                    if (data.summary.errors === 0) {
                        alert(`Successfully saved ${data.summary.successful} mappings!`);
                        // Close modal and refresh data
                        closeSpeciesHdModelModal();
                        // Trigger refresh of physiography data
                        onloadPhysiographyZoneData();
                    } else {
                        alert(`Saved ${data.summary.successful} mappings with ${data.summary.errors} errors. Please review the errors below.`);
                    }
                } else {
                    debug('Failed to save mappings:', data.error);
                    alert(`Error saving mappings: ${data.error}`);
                }
            } else {
                debug('Failed to save mappings:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to save mappings: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error saving mappings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving mappings: ${errorMessage}`);
        } finally {
            isSaving = false;
        }
    }
    
    // Copy text from focused input field
    function copyFromFocusedField() {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        let textToCopy = '';
        
        if (activeElement instanceof HTMLInputElement) {
            // For input fields, copy selected text or all text
            textToCopy = activeElement.value;
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            if (start !== null && end !== null && start !== end) {
                textToCopy = activeElement.value.substring(start, end);
            }
        } else if (activeElement instanceof HTMLSelectElement) {
            // For dropdowns, copy the selected option value (code)
            const selectedOption = activeElement.options[activeElement.selectedIndex];
            textToCopy = selectedOption ? selectedOption.value : '';
        }
        
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                debug('Copied to clipboard:', textToCopy);
            }).catch(err => {
                debug('Failed to copy to clipboard:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
        }
    }
    
    // Paste text to focused field
    async function pasteToFocusedField() {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) return;
            
            if (activeElement instanceof HTMLInputElement) {
                // For input fields, paste the text
                activeElement.value = clipboardText;
                // Trigger change event for Svelte binding
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (activeElement instanceof HTMLSelectElement) {
                // For dropdowns, find and select the option with matching value
                const selectElement = activeElement as HTMLSelectElement;
                let found = false;
                
                for (let i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value === clipboardText) {
                        selectElement.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                
                if (found) {
                    // Trigger change event for Svelte binding
                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    debug('Selected dropdown option with value:', clipboardText);
                } else {
                    debug('No dropdown option found with value:', clipboardText);
                }
            }
        } catch (err) {
            debug('Failed to read from clipboard:', err);
        }
    }
    
    // Navigate between input fields using arrow keys in grid pattern (Excel-like)
    function navigateWithArrowKeys(e: KeyboardEvent) {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        // Only handle arrow keys when modal is open
        if (!showSpeciesHdModelModal) return;
        
        // Get all focusable elements in the modal
        const modal = document.querySelector('[data-modal="species-hd-model"]');
        if (!modal) return;
        
        // Get only the input/select elements from the table body rows
        const tableRows = modal.querySelectorAll('table tbody tr');
        if (tableRows.length === 0) {
            debug('No table rows found');
            return;
        }
        
        debug('Found table rows:', tableRows.length);
        
        // Build a proper grid structure by iterating through rows
        const grid: HTMLElement[][] = [];
        const columnsPerRow = 4; // HD Model, a, b, c (Status column has no input)
        
        tableRows.forEach((row, rowIndex) => {
            const inputs = Array.from(row.querySelectorAll('td input, td select')).filter(el => {
                const element = el as HTMLElement;
                return !(element as HTMLInputElement | HTMLSelectElement).disabled;
            }) as HTMLElement[];
            
            debug(`Row ${rowIndex}: found ${inputs.length} inputs`);
            
            // Accept rows with exactly 4 inputs (HD Model dropdown + a, b, c inputs)
            if (inputs.length === columnsPerRow) {
                grid[rowIndex] = inputs;
                debug(`Row ${rowIndex} added to grid:`, inputs.map(el => el.tagName + (el instanceof HTMLSelectElement ? ':' + (el as HTMLSelectElement).value : ':' + (el as HTMLInputElement).value)));
            } else {
                debug(`Row ${rowIndex} skipped - expected ${columnsPerRow}, got ${inputs.length}`);
            }
        });
        
        if (grid.length === 0) {
            debug('No valid grid rows found');
            return;
        }
        
        debug('Built grid with rows:', grid.length);
        
        // Find current position in the grid
        let currentRow = -1;
        let currentCol = -1;
        
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col] === activeElement) {
                    currentRow = row;
                    currentCol = col;
                    break;
                }
            }
            if (currentRow !== -1) break;
        }
        
        if (currentRow === -1 || currentCol === -1) {
            debug('Could not find current element in grid. Active element:', activeElement);
            return;
        }
        
        debug('Current position in grid:', currentRow, currentCol);
        
        let nextRow = currentRow;
        let nextCol = currentCol;
        let shouldNavigate = false;
        
        switch (e.key) {
            case 'ArrowRight':
                // Move to next column in same row
                debug(`ArrowRight: currentCol=${currentCol}, columnsPerRow-1=${columnsPerRow-1}`);
                if (currentCol < columnsPerRow - 1) {
                    nextCol = currentCol + 1;
                    shouldNavigate = true;
                    debug(`ArrowRight: will move to col ${nextCol}`);
                } else {
                    debug(`ArrowRight: at rightmost column, cannot move right`);
                }
                break;
            case 'ArrowLeft':
                // Move to previous column in same row
                debug(`ArrowLeft: currentCol=${currentCol}`);
                if (currentCol > 0) {
                    nextCol = currentCol - 1;
                    shouldNavigate = true;
                    debug(`ArrowLeft: will move to col ${nextCol}`);
                } else {
                    debug(`ArrowLeft: at leftmost column, cannot move left`);
                }
                break;
            case 'ArrowDown':
                // Move to same column in next row
                debug(`ArrowDown: currentRow=${currentRow}, grid.length-1=${grid.length-1}`);
                if (currentRow < grid.length - 1) {
                    nextRow = currentRow + 1;
                    shouldNavigate = true;
                    debug(`ArrowDown: will move to row ${nextRow}`);
                } else {
                    debug(`ArrowDown: at bottom row, cannot move down`);
                }
                break;
            case 'ArrowUp':
                // Move to same column in previous row
                debug(`ArrowUp: currentRow=${currentRow}`);
                if (currentRow > 0) {
                    nextRow = currentRow - 1;
                    shouldNavigate = true;
                    debug(`ArrowUp: will move to row ${nextRow}`);
                } else {
                    debug(`ArrowUp: at top row, cannot move up`);
                }
                break;
            default:
                return;
        }
        
        debug('Navigation attempt:', e.key, 'shouldNavigate:', shouldNavigate, 'nextRow:', nextRow, 'nextCol:', nextCol);
        
        // Navigate to the new position if valid
        if (shouldNavigate && grid[nextRow] && grid[nextRow][nextCol]) {
            e.preventDefault();
            grid[nextRow][nextCol].focus();
            debug('Successfully navigated from Row:', currentRow, 'Col:', currentCol, 'to Row:', nextRow, 'Col:', nextCol);
        } else {
            debug('Navigation failed - invalid target or shouldNavigate is false');
            
            // Fallback: try simple array-based navigation
            const allInputs = Array.from(modal.querySelectorAll('table tbody tr td input, table tbody tr td select')).filter(el => {
                const element = el as HTMLElement;
                return !(element as HTMLInputElement | HTMLSelectElement).disabled;
            }) as HTMLElement[];
            
            const currentIndex = allInputs.indexOf(activeElement as HTMLElement);
            if (currentIndex !== -1) {
                let nextIndex = currentIndex;
                
                switch (e.key) {
                    case 'ArrowRight':
                        if (currentIndex % 4 < 3) nextIndex = currentIndex + 1;
                        break;
                    case 'ArrowLeft':
                        if (currentIndex % 4 > 0) nextIndex = currentIndex - 1;
                        break;
                    case 'ArrowDown':
                        if (currentIndex + 4 < allInputs.length) nextIndex = currentIndex + 4;
                        break;
                    case 'ArrowUp':
                        if (currentIndex - 4 >= 0) nextIndex = currentIndex - 4;
                        break;
                }
                
                if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < allInputs.length) {
                    e.preventDefault();
                    allInputs[nextIndex].focus();
                    debug('Fallback navigation successful to index:', nextIndex);
                }
            }
        }
    }
    
    // Set up keyboard event listeners
    onMount(() => {
        document.addEventListener('keydown', handleKeyDown);
    });
    
    onDestroy(() => {
        document.removeEventListener('keydown', handleKeyDown);
    });
    
    // Handle keyboard shortcuts
    function handleKeyDown(e: KeyboardEvent) {
        // Only handle shortcuts when modal is open
        if (!showSpeciesHdModelModal) return;
        
        // Check for Ctrl/Cmd + C (Copy)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            copyFromFocusedField();
            return;
        }
        
        // Check for Ctrl/Cmd + V (Paste)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            pasteToFocusedField();
            return;
        }
        
        // Handle arrow key navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            navigateWithArrowKeys(e);
        }
    }
</script>

<!-- Step 1: Assign HD Model to each species -->
<div class="space-y-6">
  <div class="flex items-center gap-3">
    <TreePine class="text-emerald-600" size={24} />
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Assign Height-Diameter Models</h2>
      <p class="text-slate-600">Select appropriate HD models for each physiography zone and species in your dataset</p>
    </div>
  </div>
  
  <!-- Physiography Zone Overview -->
  <div class="bg-slate-50 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-medium text-slate-900">Overview</h3>
      <div class="flex gap-2">
        <button 
          onclick={onloadPhysiographyZoneData}
          disabled={isLoadingPhysiographyData}
          class="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoadingPhysiographyData ? 'Loading...' : 'Refresh Data'}
        </button>
        <button 
          onclick={() => onassignModelsForZone(new CustomEvent('assignModelsForZone', { detail: 0 }))}
          disabled={isAssigningModels}
          class="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {isAssigningModels ? 'Assigning...' : 'Assign All Models'}
        </button>
      </div>
    </div>
    
    {#if modelsAssignedSuccessfully}
      <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div class="flex items-center gap-2 text-emerald-800">
          <CheckCircle size={16} />
          <span class="text-sm font-medium">HD models have been successfully assigned to trees!</span>
        </div>
      </div>
    {/if}
    
    {#if physiographyZones.some(zone => zone.unassigned_hd_model_count > 0)}
      <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-center gap-2 text-amber-800">
          <AlertTriangle size={16} />
          <span class="text-sm font-medium">Some trees still have unassigned HD models. This may be due to missing species-HD model mappings.</span>
        </div>
      </div>
    {/if}
    
    {#if physiographyZones.length > 0 && physiographyZones.every(zone => zone.assigned_hd_model_count === 0)}
      <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-2 text-red-800">
          <AlertTriangle size={16} />
          <span class="text-sm font-medium">No HD models have been assigned. Click on 'Assign All Models' to automatically assign HD models to trees based on species and physiography zone mappings.</span>
        </div>
      </div>
    {/if}
    
    {#if modelsAssignedSuccessfully}
      <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center gap-2 text-blue-800 mb-2">
          <Database size={16} />
          <span class="text-sm font-medium">Assignment Summary</span>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-blue-700">Total Assigned:</span>
            <span class="font-medium text-blue-900 ml-2">
              {physiographyZones.reduce((sum, zone) => sum + zone.assigned_hd_model_count, 0)}
            </span>
          </div>
          <div>
            <span class="text-blue-700">Total Unassigned:</span>
            <span class="font-medium text-blue-900 ml-2">
              {physiographyZones.reduce((sum, zone) => sum + zone.unassigned_hd_model_count, 0)}
            </span>
          </div>
        </div>
      </div>
    {/if}
    
    {#if isAssigningModels}
      <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center gap-2 text-blue-800">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span class="text-sm font-medium">Assigning HD models to trees...</span>
        </div>
        <div class="mt-2 text-xs text-blue-600">
          This process updates the hd_model_code column based on species and physiography zone mappings.
        </div>
      </div>
    {/if}
    
    {#if isLoadingPhysiographyData}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
        <span class="ml-2 text-slate-600">Loading physiography zone data...</span>
      </div>
    {:else if physiographyZones.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each physiographyZones as zone}
          <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h4 class="font-medium text-slate-900">{zone.physiography_name}</h4>
                <p class="text-xs text-slate-500">Zone {zone.phy_zone}</p>
              </div>
              <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                {zone.tree_count} Trees
              </span>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-600">Species Count:</span>
                <span class="font-medium text-slate-900">{zone.species_count}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Total Trees:</span>
                <span class="font-medium text-slate-900">{zone.tree_count}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Assigned HD Models:</span>
                <span class="font-medium text-emerald-600">{zone.assigned_hd_model_count} trees</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Unassigned HD Models:</span>
                <span class="font-medium text-amber-600">{zone.unassigned_hd_model_count} trees</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Unassigned Species:</span>
                <span class="font-medium text-red-600">{zone.unassigned_species_count || 0}</span>
              </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-200">
              <div class="flex gap-2">
                <button 
                  onclick={() => onshowZoneData(new CustomEvent('showZoneData', { detail: zone.phy_zone }))}
                  class="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Show Data
                </button>
                <button 
                  onclick={() => openSpeciesHdModelModal(zone)}
                  disabled={isLoadingUnassignedRecords}
                  class="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {isLoadingUnassignedRecords ? 'Loading...' : 'Update species-HD model'}
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-8 text-slate-500">
        <Database class="h-12 w-12 mx-auto mb-3 text-slate-500" />
        <p>No physiography zone data available</p>
        <p class="text-sm">Click "Refresh Data" to load data from the database</p>
      </div>
    {/if}
  </div>
</div>

<!-- Species-HD Model Modal -->
<SpeciesHdModelModal 
  showModal={showSpeciesHdModelModal}
  {selectedPhyZone}
  {selectedPhyZoneData}
  {unassignedRecords}
  {hdModels}
  isLoadingUnassignedRecords={isLoadingUnassignedRecordsModal}
  {isLoadingHdModels}
  {saveSummary}
  {pageSize}
  {currentPage}
  {totalPages}
  {totalRecords}
  {isSaving}
  onclose={closeSpeciesHdModelModal}
  onpageSizeChange={handlePageSizeChange}
  onloadPage={loadPage}
  onsaveAllChanges={saveAllChanges}
/>
