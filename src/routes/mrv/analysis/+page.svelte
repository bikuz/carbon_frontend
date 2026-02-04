<script lang="ts">
    import { goto } from '$app/navigation';
    import { Trees, Database, BarChart3, Leaf, ArrowLeft } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    
    let currentPhase = $state(1);
    // let currentStep = $state(1);
    
    // Initialize store from URL parameters if store is empty
    $effect(() => {
        const urlProjectId = $page.url.searchParams.get('project');
        const urlProjectName = $page.url.searchParams.get('name');
        
        if (urlProjectId && urlProjectName) {
            const currentStoreValue = $projectStore;
            if (!currentStoreValue.id || currentStoreValue.id !== urlProjectId) {
                console.log('Initializing store from URL parameters:', { id: urlProjectId, name: urlProjectName });
                projectStore.set({
                    id: urlProjectId,
                    name: decodeURIComponent(urlProjectName)
                });
            }
        }
    });

    // Get project data from store
    let projectData = $derived($projectStore);

    const phases = [
      {
        id: 1,
        title: 'Data Selection & Validation',
        shortTitle: 'Data Selection',
        description: 'Import and validate forest measurement data',
        icon: Database,
        steps: ['Import Data', 'Data Quality Check', 'Outlier Detection', 'Data Cleaning'],
        route: 'analysis/data-selection'
      },
      {
        id: 2,
        title: 'Height-Diameter Modelling',
        shortTitle: 'H-D Modelling',
        description: 'Create predictive models for tree height based on diameter',
        icon: BarChart3,
        steps: ['Model Selection', 'Parameter Estimation', 'Model Validation', 'Prediction Generation'],
        route: '/height-diameter'
      },
      {
        id: 3,
        title: 'Volume Ratio Calculation',
        shortTitle: 'Volumetric Calculation',
        description: 'Calculate tree and stand volume using allometric equations',
        icon: Trees,
        steps: ['Equation Selection', 'Volume Calculation', 'Stand Aggregation', 'Quality Assessment'],
        route: '/volume-calculation'
      },
      {
        id: 4,
        title: 'Carbon Estimation Calculation',
        shortTitle: 'Carbon Estimation',
        description: 'Estimate carbon storage and emission factors',
        icon: Leaf,
        steps: ['Biomass Estimation', 'Carbon Conversion', 'Emission Factors', 'Final Report'],
        route: '/carbon-emission'
      }
    ];
    
     function startPhase(phase: any) {
        currentPhase = phase.id;
        // currentStep = 1;
        
        // Get current URL parameters
        const urlProjectId = $page.url.searchParams.get('project');
        const urlProjectName = $page.url.searchParams.get('name');
        
        // Build target URL with parameters
        let targetUrl = phase.route;
        if (urlProjectId) targetUrl += `?project=${urlProjectId}`;
        if (urlProjectName) targetUrl += `${urlProjectId ? '&' : '?'}name=${encodeURIComponent(urlProjectName)}`;
        
        goto(targetUrl);
      }
  </script>
  
      <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <button onclick={() => goto('/mrv')} class="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft class="h-5 w-5 text-slate-600" />
            </button>
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Trees class="text-emerald-600" size={24} />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-900">{projectData?.name || 'Forest Biometric Analysis'}</h1>
              <p class="text-slate-600">Follow 4-phase process to analyze forest biometric data</p>
            </div>
          </div>
          <div class="text-sm text-slate-600">
            Phase {currentPhase} of 4
          </div>
        </div>
      </div>
  
      <!-- Process Phases Overview -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <!-- <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Analysis Workflow</h2>
            <div class="text-sm text-slate-600">
              Phase {currentPhase} of 4
            </div>
          </div>
        </div> -->
        
        <!-- Phase Progress Bar -->
        <div class="p-6">
          <div class="flex items-start">
            {#each phases as phase, index}
              <div class="flex items-center {index === 0 ? '' : 'flex-1'}">
                {#if index > 0}
                  <!-- Line before each phase except the first -->
                  <div class="flex-1 h-0.5 mx-2 mt-0 self-start translate-y-4 {currentPhase > phase.id ? 'bg-emerald-600' : 'bg-slate-200'}"></div>
                {/if}
                <div class="flex flex-col items-center">
                  <div class="flex items-center justify-center w-8 h-8 rounded-full {currentPhase > phase.id ? 'bg-emerald-600 text-white' : currentPhase === phase.id ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-600' : 'bg-slate-200 text-slate-500'}">
                    {currentPhase > phase.id ? '✓' : phase.id}
                  </div>
                  <div class="mt-2 text-xs text-center text-slate-600 max-w-20">
                    {phase.shortTitle}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
  
      <!-- Phase Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {#each phases as phase}
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="p-6">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <phase.icon class="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-slate-900 mb-2">
                    Phase {phase.id}: {phase.title}
                  </h3>
                  <p class="text-slate-600 mb-4">
                    {phase.description}
                  </p>
                  
                  <!-- Steps Preview -->
                  <div class="mb-4">
                    <h4 class="text-sm font-medium text-slate-700 mb-2">Process Steps:</h4>
                    <ul class="space-y-1">
                      {#each phase.steps as step, stepIndex}
                        <li class="flex items-center gap-2 text-sm text-slate-600">
                          <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                          {step}
                        </li>
                      {/each}
                    </ul>
                  </div>
                  
                  <button 
                    onclick={() => startPhase(phase)}
                    disabled={phase.id > currentPhase}
                    class="w-full px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {phase.id <= currentPhase ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-400'}"
                  >
                    {#if phase.id < currentPhase}
                      Continue Phase {phase.id}
                    {:else if phase.id === currentPhase}
                      Start Phase {phase.id}
                    {:else}
                      Phase {phase.id} - Locked
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
  
      <!-- Quick Stats -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="p-6 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-900">Analysis Overview</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">0</div>
              <div class="text-sm text-slate-600">Data Points</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">0</div>
              <div class="text-sm text-slate-600">Models Created</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">0</div>
              <div class="text-sm text-slate-600">Volume Calculated</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-emerald-600">0</div>
              <div class="text-sm text-slate-600">Carbon Estimated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  