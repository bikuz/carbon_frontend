<script lang="ts">
    import { PieChart } from '@lucide/svelte';
    
    // let { treeData } = $props();
    let { treeData } = $props<any>();
    
    // Calculate estimated volumes (simplified formula)
    const volumeData = $derived(() => {
      return treeData.map((tree: any) => ({
        ...tree,
        volume: Math.PI * Math.pow(tree.diameter / 200, 2) * tree.height // Simplified volume calculation
      }));
    });
    
    const totalVolume = $derived(() => 
      volumeData().reduce((sum: any, tree: any) => sum + tree.volume, 0)
    );
    
    const speciesVolumes = $derived(() => {
      const volumes:any = {};
      volumeData().forEach((tree: any)=> {
        volumes[tree.species] = (volumes[tree.species] || 0) + tree.volume;
      });
      return Object.entries(volumes).map(([species, volume]) => ({
        species,
        volume: volume as number,
        percentage: (((volume as number) / totalVolume()) * 100).toFixed(1)
      }));
    });
  </script>
  
  <div class="space-y-6">
    <!-- Volume Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <PieChart class="text-green-600" size={16} />
          <span class="text-sm font-medium text-green-700">Total Volume</span>
        </div>
        <p class="text-2xl font-bold text-green-900 mt-1">{totalVolume().toFixed(2)} m³</p>
      </div>
      
      <div class="bg-amber-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-amber-700">Avg Volume/Tree</span>
        </div>
        <p class="text-2xl font-bold text-amber-900 mt-1">
          {(totalVolume() / treeData.length).toFixed(2)} m³
        </p>
      </div>
    </div>
  
    <!-- Volume Distribution -->
    <div class="bg-slate-50 rounded-lg p-6">
      <h4 class="font-medium text-slate-900 mb-4">Volume Distribution by Species</h4>
      
      <div class="space-y-3">
        {#each speciesVolumes() as item}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span class="font-medium text-slate-900">{item.species}</span>
            </div>
            <div class="text-right">
              <div class="font-semibold text-slate-900">{item.volume.toFixed(2)} m³</div>
              <div class="text-sm text-slate-500">{item.percentage}%</div>
            </div>
          </div>
          
          <!-- Progress bar -->
          <div class="w-full bg-slate-200 rounded-full h-2">
            <div 
              class="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style="width: {item.percentage}%"
            ></div>
          </div>
        {/each}
      </div>
    </div>
  
    <!-- Individual Tree Volumes -->
    <div class="bg-white border border-slate-200 rounded-lg p-4">
      <h4 class="font-medium text-slate-900 mb-3">Individual Tree Volumes</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        {#each volumeData() as tree}
          <div class="flex justify-between items-center p-2 bg-slate-50 rounded">
            <span class="text-sm text-slate-700">{tree.species} - {tree.location}</span>
            <span class="font-medium text-slate-900">{tree.volume.toFixed(2)} m³</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
  