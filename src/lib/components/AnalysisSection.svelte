<script>
    import { BarChart3, TrendingUp, Leaf } from '@lucide/svelte';
    import HeightDiameterChart from './HeightDiameterChart.svelte';
    import VolumeRatioChart from './VolumeRatioChart.svelte';
    import CarbonEmissionChart from './CarbonEmissionChart.svelte';
    
    let { treeData } = $props();
    let activeTab = $state('height-diameter');
    
    const tabs = [
      { id: 'height-diameter', label: 'Height-Diameter Analysis', icon: BarChart3 },
      { id: 'volume-ratio', label: 'Volume Ratio', icon: TrendingUp },
      { id: 'carbon-emission', label: 'Carbon Estimation', icon: Leaf }
    ];
  </script>
  
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Tab Navigation -->
    <div class="border-b border-slate-200">
      <nav class="flex space-x-8 px-6">
        {#each tabs as tab}
          <button
            onclick={() => activeTab = tab.id}
            class="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                   {activeTab === tab.id 
                     ? 'border-emerald-500 text-emerald-600' 
                     : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
          >
            <svelte:component this={tab.icon} size={16} />
            {tab.label}
          </button>
        {/each}
      </nav>
    </div>
  
    <!-- Tab Content -->
    <div class="p-6">
      {#if activeTab === 'height-diameter'}
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Height vs Diameter Correlation</h3>
            <p class="text-slate-600">Analyze the relationship between tree height and diameter measurements.</p>
          </div>
          <HeightDiameterChart {treeData} />
        </div>
      {:else if activeTab === 'volume-ratio'}
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Volume Distribution Analysis</h3>
            <p class="text-slate-600">Examine volume ratios across different tree species and locations.</p>
          </div>
          <VolumeRatioChart {treeData} />
        </div>
      {:else if activeTab === 'carbon-emission'}
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Carbon Sequestration Estimates</h3>
            <p class="text-slate-600">Calculate carbon storage and emission reduction potential.</p>
          </div>
          <CarbonEmissionChart {treeData} />
        </div>
      {/if}
    </div>
  </div>
  