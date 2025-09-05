<script lang="ts">
    import { Ruler, AlertTriangle, CheckCircle } from '@lucide/svelte';
    import HdRelationModal from './HdRelationModal.svelte';
    
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    
    // Props
    interface Props {
        currentProjectId: number;
        physiographyZones: any[];
        heightPredictionResults: any;
        heightPredictionComplete: boolean;
        isProcessing: boolean;
        onrunHeightPrediction: () => void;
        onrefreshStatus?: (refreshFn: () => void) => void;
        onHeightPredictionStatusChange?: (isComplete: boolean) => void;
    }
    
    let {
        currentProjectId,
        physiographyZones,
        heightPredictionResults,
        heightPredictionComplete,
        isProcessing,
        onrunHeightPrediction,
        onrefreshStatus,
        onHeightPredictionStatusChange
    }: Props = $props();
    
    // State for height prediction status per zone
    let zoneStatuses: { [key: number]: any } = $state({});
    let isLoadingStatuses = $state(false);
    
    // Modal state
    let showHdRelationModal = $state(false);
    let selectedPhyZone = $state(0);
    let selectedPhyZoneData: any = $state(null);
    
    // Open H-D relation modal
    function openHdRelationModal(zone: any) {
        selectedPhyZone = zone.phy_zone;
        selectedPhyZoneData = zone;
        showHdRelationModal = true;
    }
    
    // Close H-D relation modal
    function closeHdRelationModal() {
        showHdRelationModal = false;
        selectedPhyZone = 0;
        selectedPhyZoneData = null;
    }
    
    // Check height prediction status for all zones
    async function checkHeightPredictionStatus() {
        if (!currentProjectId || physiographyZones.length === 0) return;
        
        isLoadingStatuses = true;
        try {
            const statusPromises = physiographyZones.map(async (zone) => {
                const url = `${API_ENDPOINTS.MRV_PROJECT_HEIGHT_PREDICTION_STATUS(currentProjectId)}?phy_zone=${zone.phy_zone}`;
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
            
            debug('Height prediction statuses loaded:', zoneStatuses);
        } catch (error) {
            debug('Error checking height prediction status:', error);
        } finally {
            isLoadingStatuses = false;
        }
    }
    
    // Get status for a specific zone
    function getZoneStatus(phyZone: number) {
        return zoneStatuses[phyZone] || null;
    }
    
    // Check if height prediction is complete for a zone
    function isHeightPredictionComplete(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'complete';
    }
    
    // Check if height prediction is partial for a zone
    function isHeightPredictionPartial(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'partial';
    }
    
    // Check if height prediction is not started for a zone
    function isHeightPredictionNotStarted(phyZone: number) {
        const status = getZoneStatus(phyZone);
        return status && status.status === 'not_started';
    }
    
    // Check if height prediction is complete for all zones
    function isHeightPredictionCompleteForAllZones() {
        if (physiographyZones.length === 0) return false;
        
        // Check if all zones have complete status
        return physiographyZones.every(zone => isHeightPredictionComplete(zone.phy_zone));
    }
    
    // Load status when component mounts or zones change
    $effect(() => {
        if (currentProjectId && physiographyZones.length > 0) {
            checkHeightPredictionStatus();
        }
    });
    
    // Expose refresh function to parent component
    $effect(() => {
        if (onrefreshStatus) {
            onrefreshStatus(() => checkHeightPredictionStatus());
        }
    });
    
    // Monitor height prediction completion status and notify parent
    $effect(() => {
        if (onHeightPredictionStatusChange && physiographyZones.length > 0) {
            const isComplete = isHeightPredictionCompleteForAllZones();
            debug('Height prediction completion status changed:', { isComplete, zoneStatuses });
            onHeightPredictionStatusChange(isComplete);
        }
    });
</script>

<!-- Step 2: Predict Tree Height -->
<div class="space-y-6">
  <div class="flex items-center gap-3">
    <Ruler class="text-emerald-600" size={24} />
    <div>
      <h2 class="text-xl font-semibold text-slate-900">Predict Tree Heights</h2>
      <p class="text-slate-600">Generate height predictions using the assigned HD models</p>
    </div>
  </div>
  
  
  <!-- Physiography Zone Cards -->
  {#if physiographyZones.length > 0}
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
              <div class="flex justify-between">
                <span class="text-slate-600">Assigned HD Models:</span>
                <span class="font-medium text-emerald-600">{zone.assigned_hd_model_count} trees</span>
              </div>
            </div>
            
            <div class="mt-4 pt-3 border-t border-slate-200">
              {#if isLoadingStatuses}
                <div class="flex items-center justify-center py-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span class="ml-2 text-sm text-slate-600">Checking status...</span>
                </div>
              {:else if isHeightPredictionComplete(zone.phy_zone)}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={16} />
                    <span class="text-sm font-medium">Height prediction successful</span>
                  </div>
                  <button 
                    onclick={() => openHdRelationModal(zone)}
                    class="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                  >
                    View H-D Relation
                  </button>
                </div>
              {:else if isHeightPredictionPartial(zone.phy_zone)}
                {@const status = getZoneStatus(zone.phy_zone)}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-orange-600">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">Height prediction partially completed</span>
                  </div>
                  <div class="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                    {status?.message || 'Some trees have predicted heights, others do not. Re-run to complete.'}
                  </div>
                  <button 
                    onclick={onrunHeightPrediction}
                    disabled={isProcessing}
                    class="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Re-run Height Prediction'}
                  </button>
                </div>
              {:else}
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">Height prediction not yet completed</span>
                  </div>
                  <button 
                    onclick={onrunHeightPrediction}
                    disabled={isProcessing}
                    class="w-full px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Run Height Prediction'}
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

<!-- H-D Relation Modal -->
<HdRelationModal 
  showModal={showHdRelationModal}
  {currentProjectId}
  {selectedPhyZone}
  {selectedPhyZoneData}
  onclose={closeHdRelationModal}
/>
