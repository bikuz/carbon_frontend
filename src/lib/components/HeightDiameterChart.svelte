<script lang="ts">
    import { TrendingUp } from '@lucide/svelte';
    
    let { treeData } = $props();
    
    // Calculate correlation coefficient
    const correlation = $derived(() => {
      if (!treeData || treeData.length === 0) return '0.000';

      const n = treeData.length;
      const sumX = treeData.reduce((sum:any, tree:any) => sum + tree.height, 0);
      const sumY = treeData.reduce((sum:any, tree:any) => sum + tree.diameter, 0);
      const sumXY = treeData.reduce((sum:any, tree:any) => sum + tree.height * tree.diameter, 0);
      const sumX2 = treeData.reduce((sum:any, tree:any) => sum + tree.height * tree.height, 0);
      const sumY2 = treeData.reduce((sum:any, tree:any) => sum + tree.diameter * tree.diameter, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      if (denominator === 0) {
        return '0.000'; // Or 'NaN' or handle the error as you see fit
      }
      
      return (numerator / denominator).toFixed(3);
    });
  </script>
  
  <div class="space-y-6">
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-emerald-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <TrendingUp class="text-emerald-600" size={16} />
          <span class="text-sm font-medium text-emerald-700">Correlation</span>
        </div>
        <p class="text-2xl font-bold text-emerald-900 mt-1">{correlation()}</p>
      </div>
      
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-blue-700">Avg Height</span>
        </div>
        <p class="text-2xl font-bold text-blue-900 mt-1">
          {(treeData.reduce((sum:any, tree:any) => sum + tree.height, 0) / treeData.length).toFixed(1)}m
        </p>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-purple-700">Avg Diameter</span>
        </div>
        <p class="text-2xl font-bold text-purple-900 mt-1">
          {(treeData.reduce((sum:any, tree:any) => sum + tree.diameter, 0) / treeData.length).toFixed(1)}cm
        </p>
      </div>
    </div>
  
    <!-- Scatter Plot Visualization -->
    <div class="bg-slate-50 rounded-lg p-6">
      <h4 class="font-medium text-slate-900 mb-4">Height vs Diameter Scatter Plot</h4>
      
      <div class="relative h-64 bg-white rounded border">
        <svg class="w-full h-full" viewBox="0 0 400 200">
          <!-- Grid lines -->
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <!-- Data points -->
          {#each treeData as tree, index}
            {@const x = (tree.height / 35) * 350 + 25}
            {@const y = 175 - (tree.diameter / 60) * 150}
            <circle
              cx={x}
              cy={y}
              r="4"
              fill={tree.species === 'Oak' ? '#059669' : tree.species === 'Pine' ? '#0d9488' : tree.species === 'Maple' ? '#dc2626' : '#7c3aed'}
              opacity="0.8"
            />
            <text x={x} y={y - 8} text-anchor="middle" class="text-xs fill-slate-600">
              {tree.species.slice(0, 1)}
            </text>
          {/each}
          
          <!-- Axes labels -->
          <text x="200" y="195" text-anchor="middle" class="text-xs fill-slate-600">Height (m)</text>
          <text x="15" y="100" text-anchor="middle" class="text-xs fill-slate-600" transform="rotate(-90 15 100)">Diameter (cm)</text>
        </svg>
      </div>
      
      <!-- Legend -->
      <div class="flex flex-wrap gap-4 mt-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-emerald-600"></div>
          <span class="text-xs text-slate-600">Oak</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-teal-600"></div>
          <span class="text-xs text-slate-600">Pine</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-600"></div>
          <span class="text-xs text-slate-600">Maple</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-purple-600"></div>
          <span class="text-xs text-slate-600">Birch</span>
        </div>
      </div>
    </div>
  </div>
  