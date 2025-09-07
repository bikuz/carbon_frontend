<script lang="ts">
    import { Database, CheckCircle, AlertTriangle, Edit, Info } from '@lucide/svelte';
    
    // Props
    export let physiographyZones: any[] = [];
    export let zoneResults: Record<number, any> = {};
    export let zoneProcessingStatus: Record<number, boolean> = {};
    
    // Events
    export let onAssignAllometric: (phyZone: number) => void;
    export let onOpenModal: (zone: any) => void;
</script>

<div class="flex items-center gap-3 mb-6">
  <Database class="text-emerald-600" size={24} />
  <div>
    <h2 class="text-xl font-semibold text-slate-900">Step 1: Assign Allometric Equations</h2>
    <p class="text-slate-600">Map species to allometric equations for biomass calculation</p>
  </div>
</div>

<!-- Tree Selection Criteria Information -->
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <div class="flex items-start gap-3">
    <Info class="text-blue-600 mt-1" size={20} />
    <div class="flex-1">
      <h3 class="font-semibold text-blue-900 mb-2">Tree Selection Criteria</h3>
      <p class="text-sm text-blue-800">
        This analysis includes <strong>live and dominant trees</strong> with crown class 1 to 6, 
        and excludes trees with crown class 7 and above (dead, stump, and missing trees).
      </p>
      <div class="mt-2 text-xs text-blue-700">
        <strong>Crown Class 1-6:</strong> Live and dominant trees suitable for biomass calculation<br>
        <strong>Crown Class 7+:</strong> Excluded (dead, stump, missing trees)
      </div>
    </div>
  </div>
</div>

<!-- Physiography Zones -->
{#if physiographyZones.length > 0}
  <div class="bg-slate-50 rounded-lg p-4 mb-6">
    <h3 class="font-medium text-slate-900 mb-4">Allometric Assignment by Zone</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each physiographyZones as zone}
        <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm {zone.assignment_status === 'complete' ? 'border-emerald-300 bg-emerald-50' : ''}">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-medium text-slate-900">{zone.physiography_name || `Zone ${zone.phy_zone}`}</h4>
              <p class="text-xs text-slate-500">Zone {zone.phy_zone}</p>
            </div>
            <div class="flex items-center gap-2">
              {#if zone.assignment_status === 'complete'}
                <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium flex items-center gap-1">
                  <CheckCircle size={12} />
                  Complete
                </span>
              {/if}
              <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                {zone.species_count} Species
              </span>
            </div>
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
              <span class="text-slate-600">Unique Species with DBH:</span>
              <span class="font-medium text-slate-900">{zone.unique_species_with_dbh_count || 0}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Allometric Status:</span>
              <span class="font-medium {zone.assigned_species === zone.species_count ? 'text-emerald-600' : 'text-orange-600'}">
                {zone.trees_with_vol_eqn_id || 0} trees
              </span>
            </div>
          </div>
          
          <div class="mt-4 pt-3 border-t border-slate-200">
            {#if zoneProcessingStatus[zone.phy_zone]}
              <!-- Processing Button -->
              <div class="flex items-center justify-center py-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                <span class="ml-2 text-sm text-slate-600">Assigning...</span>
              </div>
            {:else if zone.assignment_status === 'complete'}
              <!-- Completed Message -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span class="text-sm font-medium">Allometric equations assigned</span>
                </div>
                <div class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                  {zone.trees_with_vol_eqn_id} of {zone.tree_count} trees assigned
                </div>
                <div class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">
                  All trees have allometric equation assigned
                </div>
              </div>
            {:else if zone.assignment_status === 'needs_reassign'}
              <!-- Need to Re-assign -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-orange-600">
                  <AlertTriangle size={16} />
                  <span class="text-sm font-medium">Need to re-assign</span>
                </div>
                <div class="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                  {zone.species_without_vol_eqn_but_has_allometric} species have allometric equations but vol_eqn_id is missing
                </div>
                <button 
                  onclick={() => onAssignAllometric(zone.phy_zone)}
                  class="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Database size={16} />
                  Re-assign Allometric Equations
                </button>
              </div>
            {:else if zone.assignment_status === 'needs_manual_assignment'}
              <!-- Need Manual Assignment -->
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-orange-600">
                  <AlertTriangle size={16} />
                  <span class="text-sm font-medium">Species need assignment</span>
                </div>
                <div class="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                  {zone.species_without_vol_eqn_no_allometric} species don't have allometric equations
                </div>
                <button 
                  onclick={() => onOpenModal(zone)}
                  class="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit Unassigned Species
                </button>
              </div>
            {:else}
              <!-- Not Started - Show Assign Button -->
              <button 
                onclick={() => onAssignAllometric(zone.phy_zone)}
                class="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Database size={16} />
                Assign Allometric Equations
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
