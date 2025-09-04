<script lang="ts">
    import { X, Calculator } from '@lucide/svelte';
    
    interface PredictionResult {
      success: boolean;
      predicted_height?: number;
      model_type?: string;
      model_rmse?: number;
      model_r2?: number;
      error?: string;
    }
    
    let { fittedModels, onClose } = $props<{
      fittedModels: any[];
      onClose: () => void;
    }>();
    let diameter = $state('');
    let selectedSpecies = $state('');
    let predictionResult = $state<PredictionResult | null>(null);
    let isLoading = $state(false);
  
    function handleOverlayClick(event:Event) {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }
  
    async function predictHeight() {
      if (!diameter || !selectedSpecies) {
        predictionResult = {
          success: false,
          error: 'Please fill in all fields'
        };
        return;
      }
  
      isLoading = true;
      
      try {
        // Simulate API call - in real app this would be actual API request
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const model = fittedModels.find((m: any) => m.species_name === selectedSpecies);
        if (!model) {
          predictionResult = {
            success: false,
            error: 'Model not found for selected species'
          };
          return;
        }
  
        // Simple height prediction based on Curtis model
        // h = 1.3 + a * exp(-b/d)
        const [a, b] = model.parameters;
        const d = parseFloat(diameter);
        const predictedHeight = 1.3 + a * Math.exp(-b / d);
  
        predictionResult = {
          success: true,
          predicted_height: predictedHeight,
          model_type: model.model_type,
          model_rmse: model.rmse,
          model_r2: model.r_squared
        };
      } catch (error:any) {
        predictionResult = {
          success: false,
          error: 'Error calculating prediction: ' + error.message
        };
      } finally {
        isLoading = false;
      }
    }
  
    function resetForm() {
      diameter = '';
      selectedSpecies = '';
      predictionResult = null;
    }
  </script>
  
  <!-- Modal Overlay -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onclick={handleOverlayClick}
  >
    <!-- Modal Content -->
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">Predict Height</h2>
        <button 
          onclick={onClose}
          class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
  
      <!-- Body -->
      <div class="p-6 space-y-4">
        <div>
          <label for="diameter" class="block text-sm font-medium text-slate-700 mb-2">
            Diameter (cm)
          </label>
          <input
            type="number"
            id="diameter"
            bind:value={diameter}
            step="0.1"
            min="0"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Enter diameter in cm"
          />
        </div>
  
        <div>
          <label for="species_select" class="block text-sm font-medium text-slate-700 mb-2">
            Species
          </label>
          <select
            id="species_select"
            bind:value={selectedSpecies}
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select species...</option>
            {#each fittedModels as model}
              <option value={model.species_name}>{model.species_name}</option>
            {/each}
          </select>
        </div>
  
        <!-- Prediction Result -->
        {#if predictionResult}
          <div class="p-4 rounded-lg {predictionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
            {#if predictionResult.success}
              <div class="text-green-800">
                <p class="font-semibold text-lg">Predicted Height: {predictionResult.predicted_height?.toFixed(2)} m</p>
                <p class="text-sm mt-1">
                  Model: {(predictionResult.model_type?.charAt(0) || '').toUpperCase() + (predictionResult.model_type?.slice(1) || '')} 
                  (RMSE: {predictionResult.model_rmse?.toFixed(3)}, R²: {predictionResult.model_r2?.toFixed(3)})
                </p>
              </div>
            {:else}
              <p class="text-red-800 font-medium">{predictionResult.error}</p>
            {/if}
          </div>
        {/if}
      </div>
  
      <!-- Footer -->
      <div class="flex justify-end gap-3 p-6 border-t border-slate-200">
        <button 
          onclick={onClose}
          class="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
        <button 
          onclick={predictHeight}
          disabled={isLoading}
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isLoading}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {:else}
            <Calculator size={16} />
          {/if}
          Predict Height
        </button>
      </div>
    </div>
  </div>
  