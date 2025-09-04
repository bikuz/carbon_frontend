<script lang="ts">
    import { Leaf, TrendingDown } from '@lucide/svelte';
    
    // interface Tree {
    //   id: number;
    //   species: string;
    //   height: number;
    //   diameter: number;
    //   age: number;
    //   location: string;
    // }
    
    let { treeData } = $props<any>();
    
    // interface CarbonTree extends Tree {
    //   biomass: number;
    //   carbonStored: number;
    //   co2Equivalent: number;
    //   annualSequestration: number;
    // }
    
    // Carbon sequestration calculations (simplified)
    const carbonData = $derived(() => {
      return treeData.map((tree: any) => {
        const biomass = 0.25 * Math.pow(tree.diameter, 2) * tree.height; // Simplified biomass calculation
        const carbonStored = biomass * 0.47; // Carbon content ~47% of biomass
        const co2Equivalent = carbonStored * 3.67; // CO2 equivalent
        
        return {
          ...tree,
          biomass,
          carbonStored,
          co2Equivalent,
          annualSequestration: co2Equivalent / tree.age
        };
      });
    });
    
    const totalCarbon = $derived(() => 
      carbonData().reduce((sum: number, tree: any) => sum + tree.carbonStored, 0)
    );
    
    const totalCO2 = $derived(() => 
      carbonData().reduce((sum: number, tree: any) => sum + tree.co2Equivalent, 0)
    );
    
    const annualSequestration = $derived(() => 
      carbonData().reduce((sum: number, tree: any) => sum + tree.annualSequestration, 0)
    );
  </script>
  
  <div class="space-y-6">
    <!-- Carbon Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <Leaf class="text-green-600" size={16} />
          <span class="text-sm font-medium text-green-700">Total Carbon Stored</span>
        </div>
        <p class="text-2xl font-bold text-green-900 mt-1">{totalCarbon().toFixed(1)} kg</p>
      </div>
      
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <TrendingDown class="text-blue-600" size={16} />
          <span class="text-sm font-medium text-blue-700">CO₂ Equivalent</span>
        </div>
        <p class="text-2xl font-bold text-blue-900 mt-1">{totalCO2().toFixed(1)} kg</p>
      </div>
      
      <div class="bg-emerald-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-emerald-700">Annual Sequestration</span>
        </div>
        <p class="text-2xl font-bold text-emerald-900 mt-1">{annualSequestration().toFixed(1)} kg/yr</p>
      </div>
    </div>
  
    <!-- Carbon by Species -->
    <div class="bg-slate-50 rounded-lg p-6">
      <h4 class="font-medium text-slate-900 mb-4">Carbon Storage by Species</h4>
      
      <div class="space-y-4">
        {#each carbonData() as tree}
          <div class="bg-white rounded-lg p-4 border border-slate-200">
            <div class="flex justify-between items-start mb-2">
              <div>
                <h5 class="font-medium text-slate-900">{tree.species}</h5>
                <p class="text-sm text-slate-500">{tree.location} • Age: {tree.age} years</p>
              </div>
              <div class="text-right">
                <div class="font-semibold text-green-600">{tree.carbonStored.toFixed(1)} kg C</div>
                <div class="text-sm text-slate-500">{tree.co2Equivalent.toFixed(1)} kg CO₂</div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
              <div>
                <span class="text-xs text-slate-500">Biomass</span>
                <p class="font-medium text-slate-900">{tree.biomass.toFixed(1)} kg</p>
              </div>
              <div>
                <span class="text-xs text-slate-500">Annual Rate</span>
                <p class="font-medium text-slate-900">{tree.annualSequestration.toFixed(2)} kg/yr</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  
    <!-- Environmental Impact -->
    <!-- <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
      <h4 class="font-medium text-slate-900 mb-3">Environmental Impact Summary</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-slate-600 mb-2">Equivalent to removing from roads:</p>
          <p class="text-lg font-bold text-green-700">
            {Math.round(totalCO2() / 4600)} cars for 1 year
          </p>
        </div>
        <div>
          <p class="text-sm text-slate-600 mb-2">Energy equivalent saved:</p>
          <p class="text-lg font-bold text-green-700">
            {Math.round(totalCO2() * 0.12)} kWh
          </p>
        </div>
      </div>
    </div> -->
  </div>
  