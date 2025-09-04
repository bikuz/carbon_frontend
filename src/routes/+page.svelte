<script lang="ts">
    
    import FileUpload from '$lib/components/FileUpload.svelte';
    import ProjectSelector from '$lib/components/ProjectSelector.svelte';
    import DataTable from '$lib/components/DataTable.svelte';
    import AnalysisSection from '$lib/components/AnalysisSection.svelte';
    import { TreePine, Upload, Database, BarChart3 } from '@lucide/svelte';
  
    let selectedProject = $state('Forest Survey 2024');
    let selectedSchema = $state('fra_high_mountain_high_himal');
    
    let treeData = $state([
      { id: 1, species: 'Oak', height: 25.4, diameter: 45.2, age: 120, location: 'Plot A1' },
      { id: 2, species: 'Pine', height: 32.1, diameter: 38.7, age: 85, location: 'Plot A2' },
      { id: 3, species: 'Maple', height: 18.9, diameter: 52.3, age: 95, location: 'Plot B1' },
      { id: 4, species: 'Birch', height: 22.7, diameter: 41.8, age: 75, location: 'Plot B2' },
    ]);
    let climberData = $state([
      { id: 1, species: 'Ivy', coverage: 15.2, height: 8.4, treeId: 1 },
      { id: 2, species: 'Vine', coverage: 22.8, height: 12.1, treeId: 2 },
      { id: 3, species: 'Moss', coverage: 8.9, height: 3.2, treeId: 3 },
    ]);

  </script>
    
        <!-- Project Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectSelector 
            bind:selectedProject 
            bind:selectedSchema 
          />
        </div>
  
        <!-- Data Tables Section -->
        <!-- <div class="space-y-6">
          <div class="flex items-center gap-3">
            <Database class="text-emerald-600" size={20} />
            <h2 class="text-xl font-semibold text-slate-900">Dataset Overview</h2>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable 
              title="Tree Data" 
              data={treeData} 
              columns={[
                { key: 'species', label: 'Species' },
                { key: 'height', label: 'Height (m)' },
                { key: 'diameter', label: 'Diameter (cm)' },
                { key: 'age', label: 'Age (years)' },
                { key: 'location', label: 'Location' }
              ]}
            />
            
            <DataTable 
              title="Climber Data" 
              data={climberData} 
              columns={[
                { key: 'species', label: 'Species' },
                { key: 'coverage', label: 'Coverage (%)' },
                { key: 'height', label: 'Height (m)' },
                { key: 'treeId', label: 'Tree ID' }
              ]}
            />
          </div>
        </div> -->
  
        <!-- Analysis Section -->
        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <BarChart3 class="text-emerald-600" size={20} />
            <h2 class="text-xl font-semibold text-slate-900">Analysis Dashboard</h2>
          </div>
          
          <AnalysisSection {treeData} />
        </div>


 
 
  