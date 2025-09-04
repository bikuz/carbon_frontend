<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { ChartArea, Info, BarChart3, Lightbulb, ArrowLeft } from '@lucide/svelte';
  
    const modelId = $page.params.id;
  
    // Sample model data - in real app this would come from API
    let model = $state({
      id: parseInt(modelId || '0'),
      species_name: 'Oak',
      model_type: 'curtis',
      parameters: [15.234, 2.456],
      n_observations: 89,
      rmse: 1.234,
      r_squared: 0.876,
      updated_at: new Date('2024-01-15T10:30:00')
    });
  
    let residualStats = $state({
      mean: 0.023,
      std: 1.187,
      min: -3.456,
      max: 2.987
    });
  
    // Sample base64 plot - in real app this would come from backend
    let plotBase64 = $state('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNDAwIiB5PSIzMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiI+CiAgICBEaWFnbm9zdGljIFBsb3RzIFBsYWNlaG9sZGVyCiAgPC90ZXh0Pgo8L3N2Zz4K');
  
    function getRMSEClass(rmse:any) {
      if (rmse < 2) return 'text-green-600';
      if (rmse < 5) return 'text-yellow-600';
      return 'text-red-600';
    }
  
    function getR2Class(r2:any) {
      if (r2 > 0.8) return 'text-green-600';
      if (r2 > 0.6) return 'text-yellow-600';
      return 'text-red-600';
    }
  
    function getResidualClass(value:any, type:any) {
      if (type === 'mean') {
        const abs = Math.abs(value);
        if (abs < 0.5) return 'text-green-600';
        if (abs < 1) return 'text-yellow-600';
        return 'text-red-600';
      }
      if (type === 'std') {
        if (value < 2) return 'text-green-600';
        if (value < 4) return 'text-yellow-600';
        return 'text-red-600';
      }
      if (type === 'min') {
        if (value > -3) return 'text-green-600';
        if (value > -5) return 'text-yellow-600';
        return 'text-red-600';
      }
      if (type === 'max') {
        if (value < 3) return 'text-green-600';
        if (value < 5) return 'text-yellow-600';
        return 'text-red-600';
      }
      return 'text-slate-600';
    }
  
    function getModelEquation(modelType:any, parameters:any) {
      switch (modelType) {
        case 'curtis':
          return `h = 1.3 + ${parameters[0].toFixed(3)} × exp(-${parameters[1].toFixed(3)}/d)`;
        case 'naslund':
          return `h = 1.3 + d²/(${parameters[0].toFixed(3)} + ${parameters[1].toFixed(3)}×d)²`;
        case 'michailoff':
          return `h = 1.3 + ${parameters[0].toFixed(3)} × exp(-${parameters[1].toFixed(3)}/d²)`;
        default:
          return 'Unknown model type';
      }
    }
  
    function getModelDescription(modelType:any) {
      switch (modelType) {
        case 'curtis':
          return 'Curtis model: h = 1.3 + a × exp(-b/d)\nWhere h = height (m), d = diameter (cm)';
        case 'naslund':
          return 'Näslund model: h = 1.3 + d²/(a + b×d)²\nWhere h = height (m), d = diameter (cm)';
        case 'michailoff':
          return 'Michailoff model: h = 1.3 + a × exp(-b/d²)\nWhere h = height (m), d = diameter (cm)';
        default:
          return 'Unknown model type';
      }
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
  
    function goBack() {
      goto('/mrv/a-height-diameter');
    }
  </script>
  
  <svelte:head>
    <title>Model Diagnostics - {model.species_name} - Forest Biometric Analysis</title>
    <meta name="description" content="Diagnostic analysis for {model.species_name} {model.model_type} model" />
  </svelte:head>
  
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ChartArea class="text-emerald-600" size={32} />
            Model Diagnostics
          </h1>
          <p class="text-slate-600 mt-1">{model.species_name} - {model.model_type.charAt(0).toUpperCase() + model.model_type.slice(1)} Model</p>
        </div>
        <button 
          onclick={goBack}
          class="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Models
        </button>
      </div>
  
      <!-- Model Information Card -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <Info class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Model Information</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">Species</h3>
            <p class="text-xl font-semibold text-blue-600">{model.species_name}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">Model Type</h3>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800">
              {model.model_type.charAt(0).toUpperCase() + model.model_type.slice(1)}
            </span>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">Observations</h3>
            <p class="text-xl font-semibold text-slate-900">{model.n_observations}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">Last Updated</h3>
            <p class="text-sm text-slate-600">{formatDate(model.updated_at)}</p>
          </div>
        </div>
  
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">RMSE</h3>
            <p class="text-2xl font-bold {getRMSEClass(model.rmse)}">
              {model.rmse.toFixed(3)} m
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">R²</h3>
            <p class="text-2xl font-bold {getR2Class(model.r_squared)}">
              {model.r_squared.toFixed(3)}
            </p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">Parameters</h3>
            <code class="text-sm bg-slate-100 px-2 py-1 rounded">
              [{model.parameters.map(p => p.toFixed(4)).join(', ')}]
            </code>
          </div>
        </div>
      </div>
  
      <!-- Diagnostic Plots -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <ChartArea class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Diagnostic Plots</h2>
        </div>
        
        <div class="text-center">
          <img 
            src={plotBase64 || "/placeholder.svg"}
            alt="Model Diagnostic Plots"
            class="max-w-full h-auto mx-auto rounded-lg border border-slate-200"
          />
        </div>
      </div>
  
      <!-- Residual Statistics -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <BarChart3 class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Residual Statistics</h2>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <h3 class="text-sm font-medium text-slate-500 mb-2">Mean Residual</h3>
            <p class="text-2xl font-bold {getResidualClass(residualStats.mean, 'mean')}">
              {residualStats.mean.toFixed(3)} m
            </p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <h3 class="text-sm font-medium text-slate-500 mb-2">Std Deviation</h3>
            <p class="text-2xl font-bold {getResidualClass(residualStats.std, 'std')}">
              {residualStats.std.toFixed(3)} m
            </p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <h3 class="text-sm font-medium text-slate-500 mb-2">Min Residual</h3>
            <p class="text-2xl font-bold {getResidualClass(residualStats.min, 'min')}">
              {residualStats.min.toFixed(3)} m
            </p>
          </div>
          <div class="bg-slate-50 rounded-lg p-4 text-center">
            <h3 class="text-sm font-medium text-slate-500 mb-2">Max Residual</h3>
            <p class="text-2xl font-bold {getResidualClass(residualStats.max, 'max')}">
              {residualStats.max.toFixed(3)} m
            </p>
          </div>
        </div>
      </div>
  
      <!-- Model Interpretation -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <Lightbulb class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Model Interpretation</h2>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-medium text-slate-900 mb-4">Model Performance</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full {getRMSEClass(model.rmse).replace('text-', 'bg-')}"></div>
                <div>
                  <span class="font-medium">RMSE:</span> {model.rmse.toFixed(3)} m
                  {#if model.rmse < 2}
                    <span class="text-green-600 ml-2">(Excellent)</span>
                  {:else if model.rmse < 5}
                    <span class="text-yellow-600 ml-2">(Good)</span>
                  {:else}
                    <span class="text-red-600 ml-2">(Needs Improvement)</span>
                  {/if}
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full {getR2Class(model.r_squared).replace('text-', 'bg-')}"></div>
                <div>
                  <span class="font-medium">R²:</span> {model.r_squared.toFixed(3)}
                  {#if model.r_squared > 0.8}
                    <span class="text-green-600 ml-2">(Excellent fit - explains {(model.r_squared * 100).toFixed(1)}% of variance)</span>
                  {:else if model.r_squared > 0.6}
                    <span class="text-yellow-600 ml-2">(Good fit - explains {(model.r_squared * 100).toFixed(1)}% of variance)</span>
                  {:else}
                    <span class="text-red-600 ml-2">(Poor fit - explains only {(model.r_squared * 100).toFixed(1)}% of variance)</span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-medium text-slate-900 mb-4">Model Equation</h3>
            <div class="bg-slate-100 p-4 rounded-lg font-mono text-sm mb-3">
              {getModelEquation(model.model_type, model.parameters)}
            </div>
            <p class="text-sm text-slate-600 whitespace-pre-line">
              {getModelDescription(model.model_type)}
            </p>
          </div>
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-medium text-slate-900 mb-3">Recommendations</h3>
          <div class="p-4 rounded-lg {model.rmse < 2 && model.r_squared > 0.8 ? 'bg-green-50 border border-green-200' : model.rmse < 5 && model.r_squared > 0.6 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}">
            {#if model.rmse < 2 && model.r_squared > 0.8}
              <div class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-green-800">Excellent model!</p>
                  <p class="text-green-700 text-sm mt-1">This model shows high accuracy and good fit. It can be confidently used for height predictions.</p>
                </div>
              </div>
            {:else if model.rmse < 5 && model.r_squared > 0.6}
              <div class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-yellow-800">Good model.</p>
                  <p class="text-yellow-700 text-sm mt-1">This model provides reasonable accuracy but could benefit from additional data or parameter refinement.</p>
                </div>
              </div>
            {:else}
              <div class="flex items-start gap-3">
                <div class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-red-800">Model needs improvement.</p>
                  <p class="text-red-700 text-sm mt-1">Consider collecting more data, checking for outliers, or trying a different model type.</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  