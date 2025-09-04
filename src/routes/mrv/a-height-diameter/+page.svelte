<script lang="ts">
    import { TreePine, Cog, Calculator, MoreVertical, List, Play,
         Download, Upload, ChartLine, Table, ChartArea } from '@lucide/svelte';
    import HeightPredictionModal from '$lib/components/HeightPredictionModal.svelte';
    import { goto } from '$app/navigation';
  
    // Sample data - in real app this would come from API
    let totalTrees = $state(1247);
    let fittedModelsCount = $state(8);
    let treesWithPredictedHeight = $state(1089);
    let speciesGroupsCount = $state(12);
    let forceRefit = $state(false);
    let showHeightModal = $state(false);
  
    let speciesStats = $state([
      {
        species_name: 'Oak',
        total_trees: 245,
        trees_with_measured_height: 89,
        model_type: 'curtis',
        model_fitted: true,
        model_rmse: 1.234,
        model_r2: 0.876,
        id: 1
      },
      {
        species_name: 'Pine',
        total_trees: 312,
        trees_with_measured_height: 156,
        model_type: 'naslund',
        model_fitted: true,
        model_rmse: 2.145,
        model_r2: 0.743,
        id: 2
      },
      {
        species_name: 'Maple',
        total_trees: 189,
        trees_with_measured_height: 67,
        model_type: 'michailoff',
        model_fitted: false,
        model_rmse: null,
        model_r2: null,
        id: 3
      },
      {
        species_name: 'Birch',
        total_trees: 156,
        trees_with_measured_height: 78,
        model_type: 'curtis',
        model_fitted: true,
        model_rmse: 1.876,
        model_r2: 0.812,
        id: 4
      }
    ]);
  
    let fittedModels = $state([
      {
        id: 1,
        species_name: 'Oak',
        model_type: 'curtis',
        parameters: [15.234, 2.456],
        n_observations: 89,
        rmse: 1.234,
        r_squared: 0.876,
        updated_at: new Date('2024-01-15T10:30:00')
      },
      {
        id: 2,
        species_name: 'Pine',
        model_type: 'naslund',
        parameters: [8.765, 1.234],
        n_observations: 156,
        rmse: 2.145,
        r_squared: 0.743,
        updated_at: new Date('2024-01-14T14:20:00')
      },
      {
        id: 4,
        species_name: 'Birch',
        model_type: 'curtis',
        parameters: [12.456, 3.123],
        n_observations: 78,
        rmse: 1.876,
        r_squared: 0.812,
        updated_at: new Date('2024-01-13T09:15:00')
      }
    ]);
  
    function handleFitModels() {
      // In real app, this would make API call
      console.log('Fitting models with force refit:', forceRefit);
      // Simulate API call
      alert('Height models fitting initiated!');
    }
  
    function handlePredictHeights() {
      // In real app, this would make API call
      console.log('Predicting heights for all trees');
      alert('Height prediction for all trees initiated!');
    }
  
    function handleExportModels() {
      // In real app, this would trigger download
      console.log('Exporting models');
      alert('Model export initiated!');
    }
  
    function handleImportData() {
      goto('/mrv/a-height-diameter/import');
    }
  
    function viewDiagnostics(modelId:any) {
      goto(`/mrv/a-height-diameter/diagnostics/${modelId}`);
    }
  
    function getStatusBadgeClass(fitted:any) {
      return fitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    }
  
    function getModelTypeBadgeClass() {
      return 'bg-slate-100 text-slate-800';
    }
  
    function getRMSEClass(rmse:any) {
      if (!rmse) return 'text-slate-400';
      if (rmse < 2) return 'text-green-600';
      if (rmse < 5) return 'text-yellow-600';
      return 'text-red-600';
    }
  
    function getR2Class(r2:any) {
      if (!r2) return 'text-slate-400';
      if (r2 > 0.8) return 'text-green-600';
      if (r2 > 0.6) return 'text-yellow-600';
      return 'text-red-600';
    }
  
    function formatDate(date:any) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  </script>
  

  
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6 ">
      <!-- Header -->
      <div class="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class=""> 
          <h2 class="text-xl font-bold text-slate-900 flex items-center gap-3">
            <ChartLine class="text-emerald-600" size={32} />
            Height-Diameter Modeling
          </h2>
          <p class="text-slate-600 mt-1">Fit and manage height-diameter models for different tree species</p>
        </div>
      </div>
  
      <!-- Summary Cards -->
      <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-blue-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Total Trees</p>
              <p class="text-3xl font-bold">{totalTrees.toLocaleString()}</p>
            </div>
            <TreePine size={32} class="text-blue-200" />
          </div>
        </div>
  
        <div class="bg-green-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">Fitted Models</p>
              <p class="text-3xl font-bold">{fittedModelsCount}</p>
            </div>
            <Cog size={32} class="text-green-200" />
          </div>
        </div>
  
        <div class="bg-cyan-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-cyan-100 text-sm font-medium">With Predicted Heights</p>
              <p class="text-3xl font-bold">{treesWithPredictedHeight.toLocaleString()}</p>
            </div>
            <MoreVertical size={32} class="text-cyan-200" />
          </div>
        </div>
  
        <div class="bg-amber-600 text-white rounded-xl p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-amber-100 text-sm font-medium">Species Groups</p>
              <p class="text-3xl font-bold">{speciesGroupsCount}</p>
            </div>
            <List size={32} class="text-amber-200" />
          </div>
        </div>
      </div> -->
  
      <!-- Action Buttons -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <Play class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Actions</h2>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="force_refit" 
              bind:checked={forceRefit}
              class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label for="force_refit" class="text-sm text-slate-700">
              Force refit existing models
            </label>
          </div>
          
          <div class="flex flex-wrap gap-3">
            <button 
              onclick={handleFitModels}
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Cog size={16} />
              Fit Height Models
            </button>
            
            <button 
              onclick={handlePredictHeights}
              class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Calculator size={16} />
              Predict Heights for All Trees
            </button>
            
            <button 
              onclick={handleExportModels}
              class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Download size={16} />
              Export Models
            </button>
            
            <button 
              onclick={handleImportData}
              class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Upload size={16} />
              Import Data & Fit Models
            </button>
          </div>
        </div>
      </div>
  
      <!-- Species Statistics -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <Table class="text-emerald-600" size={20} />
            <h2 class="text-lg font-semibold text-slate-900">Species Statistics</h2>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Trees</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">With Measured Height</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Model Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">RMSE</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">R²</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              {#each speciesStats as species}
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-slate-900">{species.species_name}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-slate-900">
                    {species.total_trees.toLocaleString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-slate-900">
                    {species.trees_with_measured_height.toLocaleString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getModelTypeBadgeClass()}">
                      {species.model_type.charAt(0).toUpperCase() + species.model_type.slice(1)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(species.model_fitted)}">
                      {species.model_fitted ? 'Fitted' : 'Not Fitted'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {getRMSEClass(species.model_rmse)}">
                    {species.model_rmse ? species.model_rmse.toFixed(3) : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {getR2Class(species.model_r2)}">
                    {species.model_r2 ? species.model_r2.toFixed(3) : '-'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if species.model_fitted}
                      <button 
                        onclick={() => viewDiagnostics(species.id)}
                        class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ChartArea size={12} />
                        Diagnostics
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- Fitted Models Details -->
      {#if fittedModels.length > 0}
        <div class="bg-white rounded-xl shadow-sm border border-slate-200">
          <div class="p-6 border-b border-slate-200">
            <div class="flex items-center gap-3">
              <Cog class="text-emerald-600" size={20} />
              <h2 class="text-lg font-semibold text-slate-900">Fitted Models Details</h2>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Model Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Parameters</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Observations</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">RMSE</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">R²</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each fittedModels as model}
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-slate-900">{model.species_name}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        {model.model_type.charAt(0).toUpperCase() + model.model_type.slice(1)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <code class="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        [{model.parameters.map(p => p.toFixed(4)).join(', ')}]
                      </code>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-slate-900">
                      {model.n_observations}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {getRMSEClass(model.rmse)}">
                      {model.rmse.toFixed(3)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium {getR2Class(model.r_squared)}">
                      {model.r_squared.toFixed(3)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(model.updated_at)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <button 
                        onclick={() => viewDiagnostics(model.id)}
                        class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ChartArea size={12} />
                        Diagnostics
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  
    <!-- Floating Action Button -->
    <div class="fixed bottom-6 right-6">
      <button 
        onclick={() => showHeightModal = true}
        class="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        title="Predict Height"
      >
        <Calculator size={24} />
      </button>
    </div>
  
    <!-- Height Prediction Modal -->
    {#if showHeightModal}
      <HeightPredictionModal 
        {fittedModels}
        onClose={() => showHeightModal = false}
      />
    {/if}
  </div>
  