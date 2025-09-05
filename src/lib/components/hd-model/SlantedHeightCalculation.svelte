<script lang="ts">
    import { Calculator, AlertTriangle, CheckCircle } from '@lucide/svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    
    // Props
    interface Props {
        currentProjectId: number;
        physiographyZones: any[];
        slantedHeightComplete: boolean;
        slantedHeightResults: any;
        isProcessing: boolean;
        onrunSlantedHeightCalculation: () => void;
        onSlantedHeightCalculationStatusChange?: (isComplete: boolean) => void;
    }
    
    let {
        currentProjectId,
        physiographyZones,
        slantedHeightComplete,
        slantedHeightResults,
        isProcessing,
        onrunSlantedHeightCalculation,
        onSlantedHeightCalculationStatusChange
    }: Props = $props();
    
    // State for slanted height calculation status per zone
    let zoneStatuses: { [key: number]: any } = $state({});
    let isLoadingStatuses = $state(false);
    
    // Check slanted height calculation status for all zones
    async function checkSlantedHeightCalculationStatus() {
        if (!currentProjectId || !physiographyZones || physiographyZones.length === 0) return;
        
        isLoadingStatuses = true;
        try {
            const statusPromises = physiographyZones.map(async (zone) => {
                const url = `${API_ENDPOINTS.MRV_PROJECT_SLANTED_HEIGHT_CALCULATION_STATUS(currentProjectId)}?phy_zone=${zone.phy_zone}`;
                debugAPI('GET', url, null, 'request');
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    debugAPI('GET', url, data, 'response');
                    
                    if (data.success) {
                        return { phy_zone: zone.phy_zone, status: data };
                    }
                }
                return { phy_zone: zone.phy_zone, status: null };
            });
            
            const results = await Promise.all(statusPromises);
            
            // Update zone statuses
            results.forEach(result => {
                if (result.status) {
                    zoneStatuses[result.phy_zone] = result.status;
                }
            });
            
            debug('Slanted height calculation statuses loaded:', zoneStatuses);
        } catch (error) {
            debug('Error checking slanted height calculation status:', error);
        } finally {
            isLoadingStatuses = false;
        }
    }
    
    // Get status for a specific zone
    function getZoneStatus(phyZone: number) {
        return zoneStatuses[phyZone] || null;
    }
    
    // Check if slanted height calculation is complete for a zone
    function isSlantedHeightCalculationComplete(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'complete';
    }
    
    // Check if slanted height calculation is partial for a zone
    function isSlantedHeightCalculationPartial(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'partial';
    }
    
    // Check if slanted height calculation is not started for a zone
    function isSlantedHeightCalculationNotStarted(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'not_started';
    }
    
    // Check if slanted height calculation is complete for all zones
    function isSlantedHeightCalculationCompleteForAllZones() {
        if (physiographyZones.length === 0) return false;
        
        // Check if all zones have complete status
        return physiographyZones.every(zone => isSlantedHeightCalculationComplete(zone.phy_zone));
    }
    
    // Run slanted height calculation for a specific zone
    async function runSlantedHeightCalculationForZone(phyZone: number) {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_SLANTED_HEIGHT_CALCULATION(currentProjectId);
            const requestData = { phy_zone: phyZone };
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
                    debug('Slanted height calculation completed successfully:', data);
                    alert(`Slanted height calculation completed for Zone ${phyZone}! Updated ${data.updated_count} trees.`);
                    
                    // Refresh status for this zone
                    await checkSlantedHeightCalculationStatus();
                } else {
                    debug('Failed to run slanted height calculation:', data.error);
                    alert(`Error running slanted height calculation: ${data.error}`);
                }
            } else {
                debug('Failed to run slanted height calculation:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to run slanted height calculation: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error running slanted height calculation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error running slanted height calculation: ${errorMessage}`);
        }
    }
    
    // Load status when component mounts or zones change
    $effect(() => {
        if (currentProjectId && physiographyZones && physiographyZones.length > 0) {
            checkSlantedHeightCalculationStatus();
        }
    });
    
    // Monitor slanted height calculation completion status and notify parent
    $effect(() => {
        if (onSlantedHeightCalculationStatusChange && physiographyZones.length > 0) {
            const isComplete = isSlantedHeightCalculationCompleteForAllZones();
            debug('Slanted height calculation completion status changed:', { isComplete, zoneStatuses });
            onSlantedHeightCalculationStatusChange(isComplete);
        }
    });
</script>

<!-- Step 3: Slanted Tree Height Calculation -->
<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Calculator class="text-emerald-600" size={24} />
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Slanted Tree Height Calculation</h2>
      <p class="text-slate-600">Calculate corrected heights for trees that are not perfectly vertical</p>
    </div>
  </div>
  
  <!-- Physiography Zone Cards -->
  {#if physiographyZones && physiographyZones.length > 0}
    <div class="bg-slate-50 rounded-lg p-4">
      <h3 class="font-medium text-slate-900 mb-4">Overview</h3>
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
              {#if getZoneStatus(zone.phy_zone)?.calculated_trees !== undefined}
                <div class="flex justify-between">
                  <span class="text-slate-600">Slanted Trees:</span>
                  <span class="font-medium text-slate-900">{getZoneStatus(zone.phy_zone)?.calculated_trees || 0}</span>
                </div>
              {/if}
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-200">
              {#if isLoadingStatuses}
                <div class="flex items-center justify-center py-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span class="ml-2 text-sm text-slate-600">Checking status...</span>
                </div>
              {:else if isSlantedHeightCalculationComplete(zone.phy_zone)}
                {@const status = getZoneStatus(zone.phy_zone)}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={16} />
                    <span class="text-sm font-medium">Slanted height calculation successful</span>
                  </div>
                  <div class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                    <div class="font-medium mb-1">✅ {status?.calculated_trees || 0} trees processed</div>
                    <div>{status?.message || 'All trees have calculated heights.'}</div>
                  </div>
                </div>
              {:else if isSlantedHeightCalculationPartial(zone.phy_zone)}
                {@const status = getZoneStatus(zone.phy_zone)}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-orange-600">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">Slanted height calculation partially completed</span>
                  </div>
                  <div class="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                    <div class="font-medium mb-1">⚠️ {status?.calculated_trees || 0} of {status?.total_trees || 0} trees processed</div>
                    <div>{status?.message || 'Some trees have calculated heights, others do not. Re-run to complete.'}</div>
                  </div>
                  <button 
                    onclick={() => runSlantedHeightCalculationForZone(zone.phy_zone)}
                    disabled={isProcessing}
                    class="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Re-run Slanted Height Calculation'}
                  </button>
                </div>
              {:else}
                {@const status = getZoneStatus(zone.phy_zone)}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">Slanted height calculation not yet completed</span>
                  </div>
                  <div class="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                    <div class="font-medium mb-1">📊 {status?.total_trees || 0} trees ready for processing</div>
                    <p class="font-medium mb-1 mt-2">Calculation Criteria:</p>
                    <ul class="space-y-1">
                      <li>• Only trees with height &gt; 0</li>
                      <li>• Only trees with crown class &lt; 6</li>
                      <li>• Uses Pythagorean formula: √(height² + base_tree_height²)</li>
                      <!-- <li>• base_tree_height: null/negative values treated as 0</li> -->
                    </ul>
                  </div>
                  <button 
                    onclick={() => runSlantedHeightCalculationForZone(zone.phy_zone)}
                    disabled={isProcessing}
                    class="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Calculate Slanted Heights'}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
