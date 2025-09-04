<script lang="ts">
    import { goto } from '$app/navigation';
    import { ArrowLeft, AlertTriangle, Database, CheckCircle } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
         import { SelectSchema, ImportData, DataQualityCheck, DataCleaning } from '$lib/components/data-selection';
    import { API_ENDPOINTS } from '$lib/config/api';
    

    let currentStep = $state(1);
    let uploadedFile = $state<string | null>(null);
    let validationResults:any = $state ({});
    let selectedSchemaData = $state<{ schemaName: string; tableName: string } | null>(null);
     let importResults = $state<any>(null);
     let currentProjectId = $state<number>(0);
     let cameFromStep1 = $state<boolean>(false);
     let hasExistingImports = $state<boolean>(false);
     let isValidatingData = $state<boolean>(false);
     let qualityCheckResults = $state<any>(null);
    
    // Update project ID when project data changes and initialize current step
    $effect(() => {
        if (projectData?.id) {
            currentProjectId = parseInt(projectData.id);
            // Initialize current step based on project progress with a small delay
            setTimeout(() => {
                initializeCurrentStep();
            }, 100);
        }
    });
    
         // Function to initialize current step based on project progress
     async function initializeCurrentStep() {
         if (!currentProjectId) return;
         
         try {
             const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DETAIL(currentProjectId));
             if (response.ok) {
                 const data = await response.json();
                 if (data.success && data.project) {
                     const project = data.project;
                     // Set current step based on project's current_step
                     if (project.current_phase === 1 && project.current_step >= 2) {
                         currentStep = Math.min(project.current_step, steps.length); // Ensure step doesn't exceed available steps
                         // Reset cameFromStep1 when initializing from project progress (user continuing existing project)
                         cameFromStep1 = false;
                         console.log(`Initialized current step to ${currentStep} based on project progress`);
                         
                         // Check for existing imports when initializing to step 2 or higher
                         if (currentStep >= 2) {
                             await checkExistingImports();
                         }
                     }
                 }
             }
         } catch (error) {
             console.error('Error fetching project details for step initialization:', error);
         }
     }
     
     // Function to check for existing imports without validation alerts
     async function checkExistingImports() {
         if (!projectData?.id) return;
         
         try {
             const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(parseInt(projectData.id)));
             if (response.ok) {
                 const data = await response.json();
                 const imports = data.results || data || [];
                 hasExistingImports = imports.length > 0;
                 console.log(`Found ${imports.length} existing imports`);
             }
         } catch (error) {
             console.error('Error checking existing imports:', error);
         }
     }

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
    
    // Watch for schema selection changes and trigger validation
    $effect(() => {
        if (selectedSchemaData) {
            console.log('Schema selected:', selectedSchemaData);
            validateDataWithAPI();
        }
    });
    
    // Initialize current step on component mount if project data is already available
    onMount(() => {
        if (currentProjectId) {
            initializeCurrentStep();
        }
    });

    const steps = [
      { id: 1, title: 'Select Schema & Table', description: 'Select tree measurement data' },
      { id: 2, title: 'Import Data', description: 'Import data from selected schema and table' },
      { id: 3, title: 'Data Quality Check', description: 'Validate data format and completeness' },
      { id: 4, title: 'Data Cleaning', description: 'Clean and prepare data for analysis' }
    ];
    

    
    async function nextStep() {
      // Validate schema and table selection for step 1
      if (currentStep === 1) {
        if (!validateSchemaAndTable()) {
          return; // Stop execution if validation fails
        }
        
        // Mark that user came from step 1
        cameFromStep1 = true;
        
        // Update project to step 2 when moving from step 1 to step 2
        try {
          const response = await fetch(API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              current_phase: 1,  // Phase 1 - Data Collection
              current_step: 2     // Step 2 - Import Data
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('Project updated successfully:', result.project);
            }
          }
        } catch (error) {
          console.error('Error updating project:', error);
        }
      }
      
             // Validate data import for step 2
       if (currentStep === 2) {
         const isValid = await validateDataImport();
         if (!isValid) {
           return; // Stop execution if validation fails
         }
         
         // Update project to step 3 when moving from step 2 to step 3
         try {
           const response = await fetch(API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId), {
             method: 'PUT',
             headers: {
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               current_phase: 1,  // Phase 1 - Data Collection
               current_step: 3     // Step 3 - Data Quality Check
             })
           });
           
           if (response.ok) {
             const result = await response.json();
             if (result.success) {
               console.log('Project updated to step 3 successfully:', result.project);
             }
           }
         } catch (error) {
           console.error('Error updating project to step 3:', error);
         }
       }
      
      // Validate data quality check for step 3
      if (currentStep === 3) {
        const isValid = await validateDataQualityCheck();
        if (!isValid) {
          return; // Stop execution if validation fails
        }
        
        // Update project to step 4 when moving from step 3 to step 4 (Data Cleaning)
        try {
          const response = await fetch(API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              current_phase: 1,  // Phase 1 - Data Collection
              current_step: 4     // Step 4 - Data Cleaning
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('Project updated to step 4 (Data Cleaning) successfully:', result.project);
            }
          }
        } catch (error) {
          console.error('Error updating project to step 4:', error);
        }
      }
      
      if (currentStep < steps.length) {
        currentStep++;
      } else {
        // Update project to Phase 2 (Height Diameter Modeling) before navigating
        try {
          const response = await fetch(API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              current_phase: 2,  // Phase 2 - Height Diameter Modeling
              current_step: 1     // Step 1 - Start of new phase
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              console.log('Project updated to Phase 2 (Height Diameter Modeling) successfully:', result.project);
            }
          }
        } catch (error) {
          console.error('Error updating project to Phase 2:', error);
        }
        
        // Navigate to height-diameter modeling with project parameters
        const urlProjectId = $page.url.searchParams.get('project');
        const urlProjectName = $page.url.searchParams.get('name');
        let targetUrl = '/mrv/analysis/hd-model';
        if (urlProjectId && urlProjectName) {
          targetUrl += `?project=${urlProjectId}&name=${encodeURIComponent(urlProjectName)}`;
        } else if (urlProjectId) {
          targetUrl += `?project=${urlProjectId}`;
        }
        goto(targetUrl);
      }
    }
    

    
    function prevStep() {
      if (currentStep > 1) {
        currentStep--;
        // Reset cameFromStep1 when going back
        if (currentStep === 1) {
          cameFromStep1 = false;
        }
      }
    }
    
    // Function to validate data using API
    async function validateDataWithAPI() {
      if (!selectedSchemaData) {
        console.warn('No schema data selected for validation');
        return;
      }
      
      try {
         isValidatingData = true;
        console.log('Validating data for:', selectedSchemaData);
        
        // Simulate API validation for now
        setTimeout(() => {
          validationResults = {
            totalRows: 1247,
            validRows: 1198,
            errors: 12,
            warnings: 37,
            schema: selectedSchemaData?.schemaName || 'Unknown',
            table: selectedSchemaData?.tableName || 'Unknown'
          };
           isValidatingData = false;
        }, 1500);
        
      } catch (error) {
        console.error('Error validating data:', error);
         isValidatingData = false;
       }
     }
    
    // Function to validate schema and table selection
    function validateSchemaAndTable() {
      console.log('Validating schema and table:', selectedSchemaData);
      
      if (!selectedSchemaData) {
        alert('Please select both a schema and a table before proceeding.');
        return false;
      }
      
      if (!selectedSchemaData.schemaName || selectedSchemaData.schemaName.trim() === '') {
        alert('Please select a valid schema. Empty schema is not allowed.');
        return false;
      }
      
      if (!selectedSchemaData.tableName || selectedSchemaData.tableName.trim() === '') {
        alert('Please select a valid table. Empty table is not allowed.');
        return false;
      }
      
      return true;
    }
    
         // Function to validate data import completion
     async function validateDataImport() {
       console.log('Validating data import:', importResults);
       
       // Check if we have a project ID
       if (!projectData?.id) {
         alert('Project ID is required to validate imports.');
         return false;
       }
       
       try {
         // Check if any imports exist for this project
         const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_IMPORTS(parseInt(projectData.id)));
         if (response.ok) {
           const data = await response.json();
           const imports = data.results || data || [];
           
           // Update hasExistingImports state
           hasExistingImports = imports.length > 0;
           
           if (imports.length === 0) {
             alert('Please import data from at least one schema and table before proceeding.');
             return false;
           }
           
           // Check if there are any successful imports
           const successfulImports = imports.filter((imp: any) => imp.status === 'completed' || imp.status === 'success');
           if (successfulImports.length === 0) {
             alert('No successful data imports found. Please ensure at least one import is completed successfully.');
             return false;
           }
           
           // Check if there are any imports with data
           const importsWithData = successfulImports.filter((imp: any) => imp.imported_rows && imp.imported_rows > 0);
           if (importsWithData.length === 0) {
             alert('No data was imported successfully. Please ensure the selected tables contain data.');
             return false;
           }
           
           return true;
         } else {
           throw new Error('Failed to fetch import history');
         }
       } catch (error) {
         console.error('Error validating imports:', error);
         alert('Unable to validate imports. Please try again.');
         return false;
       }
     }
     
     // Function to validate data quality check completion
     async function validateDataQualityCheck() {
       console.log('Validating data quality check:', qualityCheckResults);
       
       // Check if we have quality check results
       if (!qualityCheckResults) {
         alert('Please run a data quality check before proceeding.');
         return false;
       }
       
       // Check if there are any unresolved issues
       if (qualityCheckResults.issues && qualityCheckResults.issues.length > 0) {
         const unresolvedIssues = qualityCheckResults.issues.filter((issue: any) => 
           issue.count > 0 && issue.status !== 'corrected'
         );
         
         if (unresolvedIssues.length > 0) {
           const issueTypes = unresolvedIssues.map((issue: any) => {
             switch (issue.type) {
               case 'plot_code': return 'Plot Code Generation';
               case 'phy_zone': return 'Physiography Zone Validation';
               case 'tree_no': return 'Tree Number Validation';
               case 'species_code': return 'Species Code Validation';
               case 'dbh': return 'DBH Validation';
               default: return issue.type;
             }
           }).join(', ');
           
           alert(`Please resolve all data quality issues before proceeding. Unresolved issues: ${issueTypes}`);
           return false;
         }
       }
       
       return true;
     }

  </script>
  
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <button onclick={() => goto('/mrv/analysis')} class="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft class="h-5 w-5 text-slate-600" />
            </button>
            <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Database class="text-emerald-600" size={24} />
            </div>
                         <div>
               <h1 class="text-2xl font-bold text-slate-900">Phase 1: Data Selection & Validation</h1>
               <p class="text-slate-600">Project: <strong>{projectData?.name || 'Forest Biometric Analysis'}</strong></p>
             </div>
          </div>
          <div class="text-sm text-slate-600">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </div>

      <!-- Process Steps Overview -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <!-- <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Process Steps</h2>
            <div class="text-sm text-slate-600">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div> -->
        
        <!-- Steps Progress Bar -->
        <div class="p-6">
          <div class="flex items-start">
            {#each steps as step, index}
              <div class="flex items-center {index === 0 ? '' : 'flex-1'}">
                {#if index > 0}
                  <!-- Line before each step except the first -->
                  <div class="flex-1 h-0.5 mx-2 mt-0 self-start translate-y-4 {currentStep > step.id ? 'bg-emerald-600' : 'bg-slate-200'}"></div>
                {/if}
                <div class="flex flex-col items-center">
                  <div class="flex items-center justify-center w-8 h-8 rounded-full {currentStep > step.id ? 'bg-emerald-600 text-white' : currentStep === step.id ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-600' : 'bg-slate-200 text-slate-500'}">
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div class="mt-2 text-xs text-center text-slate-600 max-w-20">
                    {step.title}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
  
      <!-- Main Content -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="p-6">
          {#if currentStep === 1}
            <!-- Select Schema Step -->
            <SelectSchema 
              bind:selectedData={selectedSchemaData}
              bind:projectId={currentProjectId}
            />
            
          {:else if currentStep === 2}
            <!-- Import Data Step -->
                         <ImportData 
               bind:selectedSchemaData={selectedSchemaData}
               bind:importResults={importResults}
               bind:projectId={currentProjectId}
               bind:cameFromStep1={cameFromStep1}
             />
            
          {:else if currentStep === 3}
             <!-- Data Quality Check Step -->
             <DataQualityCheck 
               projectId={currentProjectId}
               bind:qualityCheckResults={qualityCheckResults}
               onQualityCheckComplete={() => {
                 // Handle quality check completion
                 console.log('Quality check completed');
               }}
             />
            
          {:else if currentStep === 4}
            <!-- Data Cleaning Step -->
            <DataCleaning 
              projectId={currentProjectId}
              onCleaningComplete={() => {
                console.log('Data cleaning completed');
              }}
            />
          {/if}
          
          <!-- Navigation -->
          <div class="flex justify-between mt-8">
            <button 
              onclick={prevStep}
              disabled={currentStep === 1}
              class="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <button 
              onclick={nextStep}
               disabled={(currentStep === 1 && (!selectedSchemaData || !selectedSchemaData.schemaName || 
               !selectedSchemaData.tableName || selectedSchemaData.schemaName.trim() === '' || 
               selectedSchemaData.tableName.trim() === '')) || 
               (currentStep === 2 && (!importResults || !importResults.success) && !hasExistingImports) ||
               (currentStep === 3 && (!qualityCheckResults || (qualityCheckResults.issues && qualityCheckResults.issues.some((issue: any) => issue.count > 0 && issue.status !== 'corrected'))))}
               class="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
                 (currentStep === 1 && (!selectedSchemaData || !selectedSchemaData.schemaName || !selectedSchemaData.tableName || selectedSchemaData.schemaName.trim() === '' || selectedSchemaData.tableName.trim() === '')) || 
                 (currentStep === 2 && (!importResults || !importResults.success) && !hasExistingImports) ||
                 (currentStep === 3 && (!qualityCheckResults || (qualityCheckResults.issues && qualityCheckResults.issues.some((issue: any) => issue.count > 0 && issue.status !== 'corrected'))))
                 ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}"
             >
               {currentStep === steps.length ? 'Continue to Height-Diameter Modeling' : 
                currentStep === 1 && (!selectedSchemaData || !selectedSchemaData.schemaName ||
                 !selectedSchemaData.tableName || selectedSchemaData.schemaName.trim() === '' || 
                 selectedSchemaData.tableName.trim() === '') ? 'Select Schema and Table to Continue' :
                currentStep === 2 && (!importResults || !importResults.success) && !hasExistingImports ? 'Import Data to Continue' :
                currentStep === 3 && (!qualityCheckResults || (qualityCheckResults.issues && qualityCheckResults.issues.some((issue: any) => issue.count > 0 && issue.status !== 'corrected'))) ? 'Resolve All Issues to Continue' :
                currentStep === 4 ? 'Complete Data Cleaning' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  