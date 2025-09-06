<script lang="ts">
    import { goto } from '$app/navigation';
    import { ArrowLeft, Calculator, AlertTriangle, CheckCircle, TreePine, Info } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    
    let currentProjectId = $state<number>(0);
    let isProcessing = $state<boolean>(false);
    let processingMessage = $state<string>('');
    let volumeRatioResults = $state<any>(null);
    let volumeRatioComplete = $state<boolean>(false);
    let physiographyZones = $state<any[]>([]);
    let zoneProcessingStatus = $state<Record<number, boolean>>({});
    let zoneResults = $state<Record<number, any>>({});
    
    // Initialize store from URL parameters if store is empty
    $effect(() => {
        const urlProjectId = $page.url.searchParams.get('project');
        const urlProjectName = $page.url.searchParams.get('name');
        
        if (urlProjectId && urlProjectName) {
            const currentStoreValue = $projectStore;
            if (!currentStoreValue.id || currentStoreValue.id !== urlProjectId) {
                debug('Initializing store from URL parameters:', { id: urlProjectId, name: urlProjectName });
                projectStore.set({
                    id: urlProjectId,
                    name: decodeURIComponent(urlProjectName)
                });
            }
        }
    });

    // Get project data from store
    let projectData = $derived($projectStore);
    
    // Update project ID when project data changes
    $effect(() => {
        if (projectData?.id) {
            currentProjectId = parseInt(projectData.id);
        }
    });
    
    // Load physiography zones when project ID changes
    $effect(() => {
        if (currentProjectId > 0) {
            loadPhysiographyZones();
            checkVolumeRatioCompletion();
            checkExistingVolumeRatioResults();
        }
    });
    
    // Load physiography zones with volume ratio summary
    async function loadPhysiographyZones() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_HD_MODEL_PHYSIOGRAPHY_SUMMARY(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    physiographyZones = data.physiography_summary || [];
                    debug('Loaded physiography zones:', physiographyZones);
                }
            }
        } catch (error) {
            debug('Error loading physiography zones:', error);
        }
    }
    
    // Check volume ratio completion status
    async function checkVolumeRatioCompletion() {
        if (!currentProjectId) return;
        
        try {
            // Check if all trees have volume_ratio > 0
            const url = API_ENDPOINTS.MRV_PROJECT_VOLUME_RATIO_STATUS(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    volumeRatioComplete = data.all_completed || false;
                    debug('Volume ratio completion status:', volumeRatioComplete);
                }
            }
        } catch (error) {
            debug('Error checking volume ratio completion:', error);
        }
    }
    
    // Check existing volume ratio results for each zone
    async function checkExistingVolumeRatioResults() {
        if (!currentProjectId || physiographyZones.length === 0) return;
        
        debug('Checking existing volume ratio results for all zones');
        
        // Check each zone individually by calling the status endpoint with zone filter
        for (const zone of physiographyZones) {
            try {
                // Use the status endpoint to check if zone has completed calculations
                const url = `${API_ENDPOINTS.MRV_PROJECT_VOLUME_RATIO_STATUS(currentProjectId)}?phy_zone=${zone.phy_zone}`;
                debugAPI('GET', url, null, 'request');
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    debugAPI('GET', url, data, 'response');
                    
                    if (data.success && data.status === 'complete') {
                        // Zone has completed calculations, create a mock result object
                        zoneResults[zone.phy_zone] = {
                            totalTrees: data.total_trees || 0,
                            brokenTrees: data.broken_trees || 0,
                            processedTrees: data.calculated_trees || 0,
                            case1Count: 0, // We don't have case breakdown from status endpoint
                            case2Count: 0,
                            case3Count: 0,
                            nonBrokenCount: (data.total_trees || 0) - (data.broken_trees || 0)
                        };
                        debug(`Found existing volume ratio results for zone ${zone.phy_zone}:`, zoneResults[zone.phy_zone]);
                    }
                }
            } catch (error) {
                debug(`Error checking existing results for zone ${zone.phy_zone}:`, error);
            }
        }
    }
    
    // Run volume ratio calculation for a specific zone
    async function runVolumeRatioCalculationForZone(phyZone: number) {
        if (!currentProjectId) return;
        
        zoneProcessingStatus[phyZone] = true;
        debug(`Starting volume ratio calculation for zone ${phyZone}`);
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_VOLUME_RATIO_CALCULATION(currentProjectId);
            debugAPI('POST', url, { phy_zone: phyZone }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phy_zone: phyZone })
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug(`Volume ratio calculation completed for zone ${phyZone}:`, data);
                    
                    // Store zone results
                    zoneResults[phyZone] = {
                        totalTrees: data.total_trees || 0,
                        brokenTrees: data.broken_trees || 0,
                        processedTrees: data.processed_trees || 0,
                        case1Count: data.case1_count || 0,
                        case2Count: data.case2_count || 0,
                        case3Count: data.case3_count || 0,
                        nonBrokenCount: data.non_broken_count || 0
                    };
                    
                    // Reload physiography zones to get updated counts
                    await loadPhysiographyZones();
                    
                    // Check overall completion status
                    await checkVolumeRatioCompletion();
                    
                    alert(`Volume ratio calculation completed for ${data.physiography_name || `Zone ${phyZone}`}! Processed ${data.processed_trees} broken trees.`);
                } else {
                    debug(`Failed to run volume ratio calculation for zone ${phyZone}:`, data.error);
                    alert(`Error running volume ratio calculation for zone ${phyZone}: ${data.error}`);
                }
            } else {
                debug(`Failed to run volume ratio calculation for zone ${phyZone}:`, response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to run volume ratio calculation for zone ${phyZone}: ${errorMessage}`);
            }
        } catch (error) {
            debug(`Error running volume ratio calculation for zone ${phyZone}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error running volume ratio calculation for zone ${phyZone}: ${errorMessage}`);
        } finally {
            zoneProcessingStatus[phyZone] = false;
        }
    }
    
    // Run volume ratio calculation for all zones
    async function runVolumeRatioCalculation() {
        if (!currentProjectId) return;
        
        isProcessing = true;
        processingMessage = 'Calculating volume ratios for broken trees...';
        debug('Starting volume ratio calculation');
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_VOLUME_RATIO_CALCULATION(currentProjectId);
            debugAPI('POST', url, null, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('Volume ratio calculation completed successfully:', data);
                    
                    // Set results and completion status
                    volumeRatioResults = {
                        totalTrees: data.total_trees || 0,
                        brokenTrees: data.broken_trees || 0,
                        processedTrees: data.processed_trees || 0,
                        case1Count: data.case1_count || 0,
                        case2Count: data.case2_count || 0,
                        case3Count: data.case3_count || 0,
                        nonBrokenCount: data.non_broken_count || 0
                    };
                    volumeRatioComplete = true;
                    
                    // Show success message
                    alert(`Volume ratio calculation completed successfully! Processed ${data.processed_trees} broken trees.`);
                } else {
                    debug('Failed to run volume ratio calculation:', data.error);
                    alert(`Error running volume ratio calculation: ${data.error}`);
                }
            } else {
                debug('Failed to run volume ratio calculation:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to run volume ratio calculation: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error running volume ratio calculation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error running volume ratio calculation: ${errorMessage}`);
        } finally {
            isProcessing = false;
            processingMessage = '';
        }
    }
    
    // Navigate to next phase
    async function continueToNextPhase() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
            const updateData = {
                current_phase: 4,  // Phase 4 - Carbon Emission Calculation
                current_step: 1     // Step 1 of next phase
            };
            debugAPI('PUT', url, updateData, 'request');
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                const result = await response.json();
                debugAPI('PUT', url, result, 'response');
                
                if (result.success) {
                    debug('Project updated to Phase 4 successfully:', result.project);
                    // Navigate to next phase
                    goto(`/mrv/analysis/carbon-calc?project=${currentProjectId}&name=${encodeURIComponent(projectData?.name || '')}`);
                }
            }
        } catch (error) {
            debug('Error updating project:', error);
        }
    }
    
    // Initialize component
    onMount(() => {
        debug('VolumeRatioPage onMount', { currentProjectId });
    });
</script>

<div class="min-h-screen bg-slate-50">
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <button onclick={() => {
            // Preserve URL parameters when going back
            const urlProjectId = $page.url.searchParams.get('project');
            const urlProjectName = $page.url.searchParams.get('name');
            let targetUrl = '/mrv/analysis/hd-model';
            if (urlProjectId) targetUrl += `?project=${urlProjectId}`;
            if (urlProjectName) targetUrl += `${urlProjectId ? '&' : '?'}name=${encodeURIComponent(urlProjectName)}`;
            goto(targetUrl);
          }} class="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </button>
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TreePine class="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Phase 3: Volume Ratio Calculation</h1>
            <p class="text-slate-600">Project: <strong>{projectData?.name || 'Forest Biometric Analysis'}</strong></p>
          </div>
        </div>
        <div class="text-sm text-slate-600">
          Step 1 of 1
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div class="p-6">
        <!-- Step Header -->
        <div class="flex items-center gap-3 mb-6">
          <Calculator class="text-emerald-600" size={24} />
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Calculate Volume Ratio</h2>
            <p class="text-slate-600">Calculate volume ratios for broken trees using taper functions</p>
          </div>
        </div>
        
        <!-- Calculation Process Information -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div class="flex items-start gap-3">
            <Info class="text-blue-600 mt-1" size={20} />
            <div class="flex-1">
              <h3 class="font-semibold text-blue-900 mb-3">Volume Ratio Calculation Process</h3>
              
              <div class="space-y-4 text-sm text-blue-800">
                <div>
                  <h4 class="font-medium mb-2">1. Isolate Broken Trees</h4>
                  <p>Filter dataset where <code class="bg-blue-100 px-1 rounded">crown class = 6</code></p>
                </div>
                
                <div>
                  <h4 class="font-medium mb-2">2. Calculate Volume Ratio</h4>
                  
                  <div class="ml-4 space-y-3">
                    <div class="border-l-2 border-blue-300 pl-3">
                      <h5 class="font-medium">Case 1: measured height &lt; predicted height (height_m &lt; height_p)</h5>
                      <ul class="mt-1 space-y-1 text-xs">
                        <li>• Uses taper function to calculate the volume of a full tree (vol_p) using the predicted height (height_p)</li>
                        <li>• Uses taper function again to calculate the volume of the broken tree (vol_m) using the measured height (height_m)</li>
                        <li>• Calculates volume ratio (vol_r) = vol_m / vol_p</li>
                      </ul>
                    </div>
                    
                    <div class="border-l-2 border-orange-300 pl-3">
                      <h5 class="font-medium">Case 2: measured height &gt;= predicted height (height_m &gt;= height_p)</h5>
                      <p class="text-xs text-orange-700 mb-1">This is unusual and suggests an error.</p>
                      <ul class="mt-1 space-y-1 text-xs">
                        <li>• Assumes the true unbroken height was 10% taller than the measured height (height_m * 1.1)</li>
                        <li>• Uses the taper function to calculate what the full tree volume would be (vol_p) at this new height</li>
                        <li>• Uses the taper function again to calculate the volume of the broken tree (vol_m) using the measured height (height_m)</li>
                        <li>• Calculates volume ratio (vol_r) = vol_m / vol_p</li>
                      </ul>
                    </div>
                    
                    <div class="border-l-2 border-red-300 pl-3">
                      <h5 class="font-medium">Case 3: no measured height (height_m == 0)</h5>
                      <p class="text-xs text-red-700 mb-1">This means the field crew didn't measure the height of the broken tree.</p>
                      <ul class="mt-1 space-y-1 text-xs">
                        <li>• Uses taper function to calculate the volume of a full tree (vol_p) using the predicted height (height_p)</li>
                        <li>• Assumes the tree broke at 90% of its predicted height (height_p * 0.9)</li>
                        <li>• Uses the taper function to calculate the volume of the broken tree (vol_m) up to this assumed broken height</li>
                        <li>• Calculates volume ratio (vol_r) = vol_m / vol_p</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 class="font-medium mb-2">3. Non-Broken Trees</h4>
                  <p>For remaining trees (non-broken), volume ratio is assigned a value of <code class="bg-blue-100 px-1 rounded">1</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Physiography Zones -->
        {#if physiographyZones.length > 0}
          <div class="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 class="font-medium text-slate-900 mb-4">Overview</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each physiographyZones as zone}
                <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <h4 class="font-medium text-slate-900">{zone.physiography_name || `Zone ${zone.phy_zone}`}</h4>
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
                      <span class="text-slate-600">Broken Trees:</span>
                      <span class="font-medium text-orange-600">{zone.broken_trees || 0}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600">Non-Broken Trees:</span>
                      <span class="font-medium text-emerald-600">{zone.non_broken_trees || 0}</span>
                    </div>
                  </div>
                  
                  <div class="mt-4 pt-3 border-t border-slate-200">
                    {#if zoneResults[zone.phy_zone]}
                      <!-- Completed Message -->
                      <div class="space-y-3">
                        <div class="flex items-center gap-2 text-emerald-600">
                          <CheckCircle size={16} />
                          <span class="text-sm font-medium">Volume ratio calculated</span>
                        </div>
                        <div class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                          {zoneResults[zone.phy_zone].processedTrees} broken trees processed
                        </div>
                      </div>
                    {:else if zoneProcessingStatus[zone.phy_zone]}
                      <!-- Processing Button -->
                      <div class="flex items-center justify-center py-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        <span class="ml-2 text-sm text-slate-600">Calculating...</span>
                      </div>
                    {:else}
                      <!-- Calculate Button -->
                      <button 
                        onclick={() => runVolumeRatioCalculationForZone(zone.phy_zone)}
                        class="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Calculator size={16} />
                        Calculate Volume Ratio
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Action Buttons -->
        <div class="flex justify-between items-center">
          <button 
            onclick={() => {
              // Preserve URL parameters when going back
              const urlProjectId = $page.url.searchParams.get('project');
              const urlProjectName = $page.url.searchParams.get('name');
              let targetUrl = '/mrv/analysis/hd-model';
              if (urlProjectId) targetUrl += `?project=${urlProjectId}`;
              if (urlProjectName) targetUrl += `${urlProjectId ? '&' : '?'}name=${encodeURIComponent(urlProjectName)}`;
              goto(targetUrl);
            }}
            class="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
          >
            Previous
          </button>
          
          <div class="flex gap-3">
            <button 
              onclick={continueToNextPhase}
              disabled={!volumeRatioComplete}
              class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {volumeRatioComplete ? 'Continue to Carbon Emission Analysis' : 'Complete Volume Ratio Calculation to Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Processing Overlay -->
    {#if isProcessing}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span class="font-medium text-slate-900">Processing...</span>
          </div>
          <p class="text-slate-600 text-sm">{processingMessage}</p>
        </div>
      </div>
    {/if}
  </div>
</div>
