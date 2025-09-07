<script lang="ts">
    import { Calculator, CheckCircle, Leaf, TreePine, Zap, ChevronDown, ChevronUp } from '@lucide/svelte';
    
    // Props using Svelte 5 runes
    let {
        biomassCalculationComplete = false,
        isCalculatingBiomass = false,
        allometricAssignmentComplete = false,
        volEqnIdStatus = {},
        calculationSummary = null,
        onCalculateBiomass
    }: {
        biomassCalculationComplete?: boolean;
        isCalculatingBiomass?: boolean;
        allometricAssignmentComplete?: boolean;
        volEqnIdStatus?: any;
        calculationSummary?: any;
        onCalculateBiomass: () => void;
    } = $props();
    
    // State for collapsible section
    let showCalculationDetails = $state(false);
</script>

<div class="flex items-center gap-3 mb-6">
  <Calculator class="text-emerald-600" size={24} />
  <div>
    <h2 class="text-xl font-semibold text-slate-900">Step 2: Calculate Biomass & Carbon</h2>
    <p class="text-slate-600">Compute biomass and carbon emissions using allometric equations</p>
  </div>
</div>

<!-- Biomass Calculation Information -->
<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
  <div class="flex items-center gap-3 mb-3">
    <Leaf class="text-green-600" size={20} />
    <h3 class="font-semibold text-green-900">Biomass & Carbon Calculation Process</h3>
  </div>
  
  <!-- Brief Summary (Always Visible) -->
  <div class="text-sm text-green-800 mb-3">
    <p class="mb-2">The calculation process involves 5 main steps:</p>
    <ul class="ml-4 space-y-1">
      <li>• <strong>Height determination</strong> - Use measured or predicted height based on tree condition</li>
      <li>• <strong>Expansion factor</strong> - Scale single tree to hectare basis (7.96-198.94 trees/ha)</li>
      <li>• <strong>Volume & stem biomass</strong> - Calculate using species-specific allometric equations</li>
      <li>• <strong>Branch & foliage biomass</strong> - Apply diameter-based ratios for complete biomass</li>
      <li>• <strong>Carbon conversion</strong> - Convert to oven-dry biomass then to carbon (47% fraction)</li>
    </ul>
  </div>
  
  <!-- Expand/Collapse Button -->
  <button 
    onclick={() => showCalculationDetails = !showCalculationDetails}
    class="flex items-center gap-2 text-green-700 hover:text-green-800 hover:bg-green-100 rounded-lg px-3 py-2 transition-colors text-sm font-medium"
  >
    {#if showCalculationDetails}
      <ChevronUp size={16} />
      Show Less Details
    {:else}
      <ChevronDown size={16} />
      Show Detailed Process
    {/if}
  </button>
  
  <!-- Detailed Process (Collapsible) -->
  {#if showCalculationDetails}
    <div class="mt-4 space-y-4 text-sm text-green-800 border-t border-green-200 pt-4">
      <div>
        <h4 class="font-medium mb-2">1. Determine the Height to Use (height_use)</h4>
        <ul class="mt-1 ml-4 space-y-1">
          <li>• If the tree is broken (crown_class == 6) and its predicted height (Pre_ht) is less than its measured height (height), use height × 1.1</li>
          <li>• Otherwise, use the measured height</li>
          <li>• If no height was measured (or it was below 1.3m), use the predicted height Pre_ht</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">2. Calculate Expansion Factor</h4>
        <p>The expansion factor (exp_fa) scales up single tree measurement to represent a full hectare. Based on the tree's adjusted diameter (predbh):</p>
        <ul class="mt-1 ml-4 space-y-1">
          <li>• If predbh &lt; 10 cm → exp_fa = 198.94 trees/ha</li>
          <li>• If 10 cm ≤ predbh &lt; 20 cm → exp_fa = 49.74 trees/ha</li>
          <li>• If 20 cm ≤ predbh &lt; 30 cm → exp_fa = 14.15 trees/ha</li>
          <li>• If predbh ≥ 30 cm → exp_fa = 7.96 trees/ha</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">3. Calculate Tree Volume and Biomass</h4>
        <ul class="mt-1 ml-4 space-y-1">
          <li>• <strong>Basal Area (BA_tree_sqm)</strong>: (π × predbh²) / 40,000</li>
          <li>• <strong>Stem Volume (volume_cum_tree)</strong>: exp(Stem_a + Stem_b × log(predbh) + Stem_c × log(height_use)) / 1000</li>
          <li>• <strong>Max Volume</strong>: BA_tree_sqm × height_use × 0.7 (form factor)</li>
          <li>• <strong>Volume Correction</strong>: Apply volume_ratio based on comparison with max volume</li>
          <li>• <strong>Volume per ha</strong>: volume_final_cum_tree × exp_fa</li>
          <li>• <strong>Stem Biomass</strong>: volume_final_cum_tree × density</li>
          <li>• <strong>Stem Biomass per ha</strong>: (stem_kg_tree × exp_fa) / 1000</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">4. Calculate Branch and Foliage Biomass</h4>
        <p>Find ratios using species-specific parameters with diameter-based interpolation:</p>
        <ul class="mt-1 ml-4 space-y-1">
          <li>• <strong>Branch Ratio</strong>: Interpolate between branch_s, branch_m, branch_l based on predbh</li>
          <li>• <strong>Foliage Ratio</strong>: Interpolate between foliage_s, foliage_m, foliage_l based on predbh</li>
          <li>• <strong>Branch Biomass</strong>: stem_kg_tree × b_ratio</li>
          <li>• <strong>Foliage Biomass</strong>: stem_kg_tree × f_ratio</li>
        </ul>
      </div>
      
      <div>
        <h4 class="font-medium mb-2">5. Scale Up to Per-Hectare and Convert to Carbon</h4>
        <ul class="mt-1 ml-4 space-y-1">
          <li>• <strong>Total Tree Biomass</strong>: stem_kg_tree + branch_kg_tree + foliage_kg_tree</li>
          <li>• <strong>Biomass per ha (Air-Dry)</strong>: (Total_kg_tree × exp_fa) / 1000</li>
          <li>• <strong>Biomass per ha (Oven-Dry)</strong>: Total_biom_ad_ton_ha / 1.1</li>
          <li>• <strong>Carbon per ha</strong>: Total_biom_od_ton_ha × 0.47 (47% carbon fraction)</li>
        </ul>
      </div>
    </div>
  {/if}
</div>

<!-- Calculation Results -->
{#if biomassCalculationComplete && calculationSummary}
  <div class="bg-slate-50 rounded-lg p-6 mb-6">
    <h3 class="font-medium text-slate-900 mb-4">Calculation Results</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <TreePine class="text-blue-600" size={20} />
          </div>
          <div>
            <p class="text-sm text-slate-600">Total Trees</p>
            <p class="text-lg font-semibold text-slate-900">{calculationSummary.total_trees || 0}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Leaf class="text-green-600" size={20} />
          </div>
          <div>
            <p class="text-sm text-slate-600">Total Biomass</p>
            <p class="text-lg font-semibold text-slate-900">{calculationSummary.total_biomass || 0} t/ha</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Leaf class="text-emerald-600" size={20} />
          </div>
          <div>
            <p class="text-sm text-slate-600">Total Carbon</p>
            <p class="text-lg font-semibold text-slate-900">{calculationSummary.total_carbon || 0} t/ha</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-4 border border-slate-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Zap class="text-orange-600" size={20} />
          </div>
          <div>
            <p class="text-sm text-slate-600">CO₂ Equivalent</p>
            <p class="text-lg font-semibold text-slate-900">{calculationSummary.co2_equivalent || 0} t/ha</p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Calculate Button -->
<div class="flex justify-center">
  {#if biomassCalculationComplete}
    <div class="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-lg">
      <CheckCircle size={20} />
      <span class="font-medium">Biomass and carbon calculation completed successfully!</span>
    </div>
  {:else}
    <button 
      onclick={onCalculateBiomass}
      disabled={!allometricAssignmentComplete || !volEqnIdStatus.vol_eqn_ids_complete || isCalculatingBiomass}
      class="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-3 text-lg"
    >
      {#if isCalculatingBiomass}
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        Calculating...
      {:else}
        <Calculator size={20} />
        Calculate Biomass & Carbon
      {/if}
    </button>
  {/if}
</div>
