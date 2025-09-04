<script>
    import { ChevronDown, FolderOpen, Database } from '@lucide/svelte';
    
    let { selectedProject = $bindable(), selectedSchema = $bindable() } = $props();
    
    const projects = [
      'Forest Survey 2024',
      'Forest Survey 2023',
      'Forest Survey 2022',
      'Forest Survey 2021'
    ];
    
    const schemas = [
      'fra_high_mountain_high_himal',
      'Carbon Analysis Schema',
      'Biodiversity Assessment Schema',
      'Growth Monitoring Schema'
    ];
  </script>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Project Selection -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <FolderOpen class="text-emerald-600" size={20} />
        <h3 class="font-semibold text-slate-900">Active Project</h3>
      </div>
      
      <div class="relative">
        <select
          bind:value={selectedProject}
          class="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
        >
          {#each projects as project}
            <option value={project}>{project}</option>
          {/each}
        </select>
        <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
      
      <!-- <div class="mt-3 p-3 bg-emerald-50 rounded-lg">
        <p class="text-sm text-emerald-700">
          <strong>Status:</strong> Active • 1,247 records
        </p>
      </div> -->
    </div>
  
    <!-- Schema Selection -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <Database class="text-emerald-600" size={20} />
        <h3 class="font-semibold text-slate-900">Foris Data Schema</h3>
      </div>
      
      <div class="relative">
        <select
          bind:value={selectedSchema}
          class="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
        >
          {#each schemas as schema}
            <option value={schema}>{schema}</option>
          {/each}
        </select>
        <ChevronDown class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>
      
      <!-- <div class="mt-3 p-3 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-700">
          <strong>Version:</strong> 2.1 • Last updated: Dec 2024
        </p>
      </div> -->
    </div>
  </div>
  