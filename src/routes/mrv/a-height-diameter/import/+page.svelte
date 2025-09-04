<script lang="ts">
    import { Upload, FileText, Info, ArrowLeft, Heading2 } from '@lucide/svelte';
    import { goto } from '$app/navigation';
  
    let csvFile = $state<File | null>(null);
    let clearExisting = $state(false);
    let autoFitModels = $state(true);
    let dragOver = $state(false);
  
    function handleFileSelect(event:Event) {
        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);

      const file = files[0];
      if (file && file.type === 'text/csv') {
        csvFile = file;
      }
    }
  
    function handleDrop(event: DragEvent) {
      event.preventDefault();
      dragOver = false;
      
      const file = event.dataTransfer?.files[0];
      if (file && file.type === 'text/csv') {
        csvFile = file;
      }
    }
    
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      dragOver = true;
    }
    
    function handleDragLeave(event: DragEvent) {
      event.preventDefault();
      dragOver = false;
    }
  
    function handleSubmit(event:Event) {
      event.preventDefault();
      if (!csvFile) {
        alert('Please select the schema');
        return;
      }
      
      // In real app, this would upload the file and process it
      console.log('Uploading file:', csvFile.name);
      console.log('Clear existing:', clearExisting);
      console.log('Auto fit models:', autoFitModels);
      
      alert('File upload and processing initiated!');
      goto('/mrv/a-height-diameter');
    }
  
    function goBack() {
      goto('/mrv/a-height-diameter');
    }
  
    function formatFileSize(bytes: number) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  </script>
  

  
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900 flex items-center gap-3">
            <Upload class="text-emerald-600" size={32} />
            Import Tree Data with Height Modeling
          </h2>
          <p class="text-slate-600 mt-1">Import data and automatically fit height-diameter models</p>
        </div>
      </div>
  
      <!-- Upload Form -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <!-- <div class="flex items-center gap-3 mb-6">
          <FileText class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Upload Tree Data</h2>
        </div> -->
  
        <form onsubmit={handleSubmit} class="space-y-6">
          <!-- File Upload Area -->
          <!-- <div>
            <label for="csv_file" class="block text-sm font-medium text-slate-700 mb-2">
              CSV File
            </label>
            
            <div 
              class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {dragOver ? 'border-emerald-400 bg-emerald-50' : csvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'}"
              ondrop={handleDrop}
              ondragover={handleDragOver}
              ondragleave={handleDragLeave}
            >
              {#if csvFile}
                <div class="space-y-2">
                  <FileText class="mx-auto text-green-600" size={48} />
                  <div>
                    <p class="text-lg font-medium text-green-800">{csvFile.name}</p>
                    <p class="text-sm text-green-600">{formatFileSize(csvFile.size)}</p>
                  </div>
                  <button 
                    type="button"
                    onclick={() => csvFile = null}
                    class="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove file
                  </button>
                </div>
              {:else}
                <div class="space-y-4">
                  <Upload class="mx-auto text-slate-400" size={48} />
                  <div>
                    <p class="text-lg font-medium text-slate-900">Drop your CSV file here</p>
                    <p class="text-slate-600">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    id="csv_file"
                    accept=".csv"
                    onchange={handleFileSelect}
                    class="hidden"
                  />
                  <label 
                    for="csv_file"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Upload size={16} />
                    Choose File
                  </label>
                </div>
              {/if}
            </div>
            
            <p class="text-sm text-slate-500 mt-2">
              Upload CSV file with tree data. Required columns: col, row, plot_number, tree_no, diameter_p, height_p, crown_class, species
            </p>
          </div> -->
  
          <!-- Options -->
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="clear_existing" 
                bind:checked={clearExisting}
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label for="clear_existing" class="text-sm text-slate-700">
                Clear existing tree data before import
              </label>
            </div>
            
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="auto_fit_models" 
                bind:checked={autoFitModels}
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label for="auto_fit_models" class="text-sm text-slate-700">
                Automatically fit height-diameter models after import
              </label>
            </div>
          </div>
  
          <!-- Process Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Info class="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 class="font-medium text-blue-800 mb-2">Import Process:</h3>
                <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Tree data will be imported from database</li>
                  <li>Height-diameter models will be fitted for each species (if enabled)</li>
                  <li>Heights will be predicted for all trees using the fitted models</li>
                  <li>Results will be available in the Height-Diameter Modeling section</li>
                </ol>
              </div>
            </div>
          </div>
  
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button 
              type="submit"
              class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Upload size={20} />
              Import Data and Fit Models
            </button>
            
            <button 
              type="button"
              onclick={goBack}
              class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Height Modeling
            </button>
          </div>
        </form>
      </div>
  
      <!-- CSV Format Guide -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div class="flex items-center gap-3 mb-6">
          <Info class="text-emerald-600" size={20} />
          <h2 class="text-lg font-semibold text-slate-900">Data Format Guide</h2>
        </div>
  
        <div class="space-y-6">
          <div>
            <h3 class="text-base font-medium text-slate-900 mb-3">Required Columns:</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-slate-200 rounded-lg">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Column Name</th>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Description</th>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Example Values</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">col</code></td>
                    <td class="px-4 py-3 text-slate-600">Column number</td>
                    <td class="px-4 py-3 text-slate-600">1, 2, 3, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">row</code></td>
                    <td class="px-4 py-3 text-slate-600">Row number</td>
                    <td class="px-4 py-3 text-slate-600">1, 2, 3, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">plot_number</code></td>
                    <td class="px-4 py-3 text-slate-600">Plot identifier</td>
                    <td class="px-4 py-3 text-slate-600">P001, P002, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">tree_no</code></td>
                    <td class="px-4 py-3 text-slate-600">Tree number within plot</td>
                    <td class="px-4 py-3 text-slate-600">1, 2, 3, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">diameter_p</code></td>
                    <td class="px-4 py-3 text-slate-600">Predicted/measured diameter (cm)</td>
                    <td class="px-4 py-3 text-slate-600">15.5, 23.2, 34.1, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">height_p</code></td>
                    <td class="px-4 py-3 text-slate-600">Predicted height (m)</td>
                    <td class="px-4 py-3 text-slate-600">12.5, 18.3, 25.7, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">crown_class</code></td>
                    <td class="px-4 py-3 text-slate-600">Crown class (1-8)</td>
                    <td class="px-4 py-3 text-slate-600">1, 2, 3, 4, 5, 6</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">species</code></td>
                    <td class="px-4 py-3 text-slate-600">Species code</td>
                    <td class="px-4 py-3 text-slate-600">6615, 6660, 6651, ...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <div>
            <h3 class="text-base font-medium text-slate-900 mb-3">Optional Columns:</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-slate-200 rounded-lg">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Column Name</th>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Description</th>
                    <th class="px-4 py-3 text-left font-medium text-slate-700 border-b border-slate-200">Example Values</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">height_m</code></td>
                    <td class="px-4 py-3 text-slate-600">Measured height (m)</td>
                    <td class="px-4 py-3 text-slate-600">12.3, 17.8, 24.5, ...</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3"><code class="bg-slate-100 px-2 py-1 rounded text-xs">sample_tree_type</code></td>
                    <td class="px-4 py-3 text-slate-600">Sample tree type (1,2,4,5 for modeling)</td>
                    <td class="px-4 py-3 text-slate-600">1, 2, 3, 4, 5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              <div>
                <p class="font-medium text-yellow-800 mb-1">Note:</p>
                <p class="text-sm text-yellow-700">
                  Only trees with measured heights (height_m > 0) and specific sample tree types (1,2,4,5) will be used for fitting height-diameter models. All other trees will receive predicted heights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  