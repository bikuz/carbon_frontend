<script lang="ts">
    import { goto } from '$app/navigation';
    import { ArrowLeft, AlertTriangle, Database, CheckCircle, TreePine, Ruler, TrendingUp, Calculator } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI, debugComponent, debugState } from '$lib/utils/debug';
    import HdModelAssignment from '$lib/components/hd-model/HdModelAssignment.svelte';
    import HeightPrediction from '$lib/components/hd-model/HeightPrediction.svelte';
    import SlantedHeightCalculation from '$lib/components/hd-model/SlantedHeightCalculation.svelte';
    
    let currentStep = $state(1);
    let currentProjectId = $state<number>(0);
    let isProcessing = $state<boolean>(false);
    let processingMessage = $state<string>('');
    
    // Step 1: HD Model Assignment
    let hdModelAssignmentComplete = $state<boolean>(false);
    let isAssigningModels = $state<boolean>(false);
    let modelsAssignedSuccessfully = $state<boolean>(false);
    
    // Modal state for species-HD model table
    let showSpeciesHdModelModal = $state<boolean>(false);
    let selectedPhyZone = $state<number>(0);
    let unassignedRecords = $state<any[]>([]);
    let isLoadingUnassignedRecords = $state<boolean>(false);
    let selectedPhyZoneData: any = $state<any>(null); // To store zone data for modal title
    
    // HD Model list for dropdown
    let hdModels = $state<any[]>([]);
    let isLoadingHdModels = $state<boolean>(false);
    
    // Global keyboard event handler for copy functionality
    let copyEventHandler: ((e: KeyboardEvent) => void) | null = null;
    
    // Track changes for all records
    let hasUnsavedChanges = $state<boolean>(false);
    
    // Save results state
    let saveResults = $state<any[]>([]);
    let isSaving = $state<boolean>(false);
    let saveSummary = $state<any>(null);
    
    // Track if species-HD model mappings have been saved
    let speciesMappingsSaved = $state<boolean>(false);
    
    // Pagination state
    let currentPage = $state<number>(1);
    let pageSize = $state<number>(10);
    let totalRecords = $state<number>(0);
    let totalPages = $state<number>(0);
    
    // Physiography zone data with counts
    let physiographyZones = $state<any[]>([]);
    let isLoadingPhysiographyData = $state<boolean>(false);
    
    // Step 2: Height Prediction
    let heightPredictionResults = $state<any>(null);
    let heightPredictionComplete = $state<boolean>(false);
    let refreshHeightPredictionStatus = $state<(() => void) | null>(null);
    let heightPredictionStatusFromComponent = $state<boolean>(false);
    
    // Step 3: Slanted Tree Height Calculation
    let slantedHeightResults = $state<any>(null);
    let slantedHeightComplete = $state<boolean>(false);
    let slantedHeightStatusFromComponent = $state<boolean>(false);
    
    // Initialize store from URL parameters if store is empty
    $effect(() => {
        const urlProjectId = $page.url.searchParams.get('project');
        const urlProjectName = $page.url.searchParams.get('name');
        
        if (urlProjectId && urlProjectName) {
            const currentStoreValue = $projectStore;
            if (!currentStoreValue.id || currentStoreValue.id !== urlProjectId) {
                debug('Initializing store from URL parameters:', { id: urlProjectId, name: urlProjectName });
                projectStore.set({
                    id: urlProjectId,
                    name: decodeURIComponent(urlProjectName)
                });
            }
        }
    });

    // Get project data from store
    let projectData = $derived($projectStore);
    
    // Update project ID when project data changes
    $effect(() => {
        if (projectData?.id) {
            currentProjectId = parseInt(projectData.id);
            // Initialize current step based on project progress
            setTimeout(() => {
                initializeCurrentStep();
                loadPhysiographyZoneData(); // Load physiography data when project changes
            }, 100);
        }
    });
    
    // Function to initialize current step based on project progress
    async function initializeCurrentStep() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_DETAIL(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.project) {
                    const project = data.project;
                    // Set current step based on project's current_step for Phase 2
                    if (project.current_phase === 2 && project.current_step >= 1) {
                        currentStep = Math.min(project.current_step, 3);
                        debug(`Initialized current step to ${currentStep} based on project progress`);
                        
                        // Load existing data for steps that have been completed
                        if (currentStep >= 2) {
                            await loadHeightPredictionData();
                        }
                        if (currentStep >= 3) {
                            await loadSlantedHeightData();
                        }
                    }
                }
            }
        } catch (error) {
            debug('Error fetching project details for step initialization:', error);
        }
    }
    
    // Load physiography zone data with counts from tree_biometric_calc table
    async function loadPhysiographyZoneData() {
        if (!currentProjectId) return;
        
        isLoadingPhysiographyData = true;
        // Reset success state when refreshing data
        modelsAssignedSuccessfully = false;
        
        try {
            // Use the new efficient API endpoint that executes SQL directly
            const url = API_ENDPOINTS.MRV_PROJECT_HD_MODEL_PHYSIOGRAPHY_SUMMARY(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.physiography_summary) {
                    physiographyZones = data.physiography_summary;
                    debug('Physiography zone summary loaded:', physiographyZones);
                }
            } else {
                debug('Failed to load physiography zone summary:', response.status);
                const errorData = await response.json().catch(() => ({}));
                debug('Error response data:', errorData);
            }
        } catch (error) {
            debug('Error loading physiography zone data:', error);
        } finally {
            isLoadingPhysiographyData = false;
        }
    }
    

    
    // Load height prediction data
    async function loadHeightPredictionData() {
        try {
            debug('Loading height prediction data (mock)');
            // This would be replaced with actual API call
            // const response = await fetch(API_ENDPOINTS.MRV_HEIGHT_PREDICTION_RESULTS(currentProjectId));
            heightPredictionResults = {
                totalTrees: 150,
                predictedHeights: 150,
                accuracy: 0.92,
                rmse: 1.2
            };
            heightPredictionComplete = true;
            debug('Height prediction data loaded (mock):', heightPredictionResults);
        } catch (error) {
            debug('Error loading height prediction data:', error);
        }
    }
    
    // Load slanted height calculation data
    async function loadSlantedHeightData() {
        try {
            debug('Loading slanted height data (mock)');
            // This would be replaced with actual API call
            // const response = await fetch(API_ENDPOINTS.MRV_SLANTED_HEIGHT_RESULTS(currentProjectId));
            slantedHeightResults = {
                totalTrees: 150,
                slantedTrees: 23,
                correctedHeights: 23,
                correctionFactor: 0.85
            };
            slantedHeightComplete = true;
            debug('Slanted height data loaded (mock):', slantedHeightResults);
        } catch (error) {
            debug('Error loading slanted height data:', error);
        }
    }
        
    // Load HD models for dropdown
    async function loadHdModels() {
        if (hdModels.length > 0) return; // Already loaded
        
        isLoadingHdModels = true;
        try {
            const url = API_ENDPOINTS.MRV_HD_MODEL_LIST;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.hd_models) {
                    hdModels = data.hd_models;
                    debug('HD models loaded:', hdModels);
                } else {
                    debug('Failed to load HD models:', data.error);
                }
            } else {
                debug('Failed to load HD models:', response.status);
            }
        } catch (error) {
            debug('Error loading HD models:', error);
        } finally {
            isLoadingHdModels = false;
        }
    }
    
    // Initialize component
    onMount(() => {
        debugComponent('HDModelPage', 'onMount', { currentProjectId });
        if (currentProjectId) {
            loadPhysiographyZoneData();
            initializeCurrentStep();
        }
    });
    
    // Clean up event listener when component is destroyed
    onDestroy(() => {
        if (copyEventHandler) {
            document.removeEventListener('keydown', copyEventHandler);
        }
    });
    
    // Debug state changes
    $effect(() => {
        const oldStep = currentStep;
        debugState('currentStep', oldStep, currentStep);
    });
    
    $effect(() => {
        const oldZones = physiographyZones;
        debugState('physiographyZones', oldZones, physiographyZones);
    });
    
    $effect(() => {
        const oldAssigned = modelsAssignedSuccessfully;
        debugState('modelsAssignedSuccessfully', oldAssigned, modelsAssignedSuccessfully);
    });
    
    const steps = [
        { id: 1, title: 'Assign HD Model', description: 'Assign height-diameter models to each species' },
        { id: 2, title: 'Predict Tree Height', description: 'Generate height predictions using assigned models' },
        { id: 3, title: 'Slanted Tree Height', description: 'Calculate corrected heights for slanted trees' }
    ];
    
    async function nextStep() {
        if (currentStep === 1) {
            // Validate HD model assignment
            if (!validateHdModelAssignment()) {
                return;
            }
            
            // Update project to step 2
            try {
                const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
                const updateData = {
                    current_phase: 2,  // Phase 2 - HD Modeling
                    current_step: 2     // Step 2 - Height Prediction
                };
                debugAPI('PUT', url, updateData, 'request');
                
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    debugAPI('PUT', url, result, 'response');
                    
                    if (result.success) {
                        debug('Project updated to step 2 successfully:', result.project);
                        hdModelAssignmentComplete = true;
                        currentStep = 2;
                    }
                }
            } catch (error) {
                debug('Error updating project:', error);
            }
        } else if (currentStep === 2) {
            // Validate height prediction
            if (!validateHeightPrediction()) {
                return;
            }
            
            // Update project to step 3
            try {
                const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
                const updateData = {
                    current_phase: 2,  // Phase 2 - HD Modeling
                    current_step: 3     // Step 3 - Slanted Height Calculation
                };
                debugAPI('PUT', url, updateData, 'request');
                
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    debugAPI('PUT', url, result, 'response');
                    
                    if (result.success) {
                        debug('Project updated to step 3 successfully:', result.project);
                        heightPredictionComplete = true;
                        currentStep = 3;
                    }
                }
            } catch (error) {
                debug('Error updating project:', error);
            }
        } else if (currentStep === 3) {
            // Complete slanted height calculation
            if (!validateSlantedHeightCalculation()) {
                return;
            }
            
            // Update project to next phase
            try {
                const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
                const updateData = {
                    current_phase: 3,  // Phase 3 - Volume Ratio
                    current_step: 1     // Step 1 of next phase
                };
                debugAPI('PUT', url, updateData, 'request');
                
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    debugAPI('PUT', url, result, 'response');
                    
                    if (result.success) {
                        debug('Project updated to Phase 3 successfully:', result.project);
                        slantedHeightComplete = true;
                        // Navigate to next phase
                        goto(`/mrv/analysis/vol-calc?project=${currentProjectId}&name=${encodeURIComponent(projectData?.name || '')}`);
                    }
                }
            } catch (error) {
                debug('Error updating project:', error);
            }
        }
    }
    
    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
    
    function validateHdModelAssignment() {
        // Check if physiography zone data is loaded and has some assigned models
        const hasZoneData = physiographyZones.length > 0;
        const hasAssignedModels = physiographyZones.some(zone => zone.assigned_hd_model_count > 0);
        const totalUnassigned = physiographyZones.reduce((sum, zone) => sum + zone.unassigned_hd_model_count, 0);
        const totalAssigned = physiographyZones.reduce((sum, zone) => sum + zone.assigned_hd_model_count, 0);
        
        // Consider assignment complete if:
        // 1. Models are automatically assigned successfully, OR
        // 2. Species mappings have been manually saved, OR
        // 3. There are no unassigned models (all models already assigned)
        const isComplete = hasZoneData && (
            modelsAssignedSuccessfully || 
            speciesMappingsSaved || 
            totalUnassigned === 0
        );
        
        debug('HD Model Assignment Validation:', {
            hasZoneData,
            hasAssignedModels,
            totalUnassigned,
            totalAssigned,
            modelsAssignedSuccessfully,
            speciesMappingsSaved,
            isComplete,
            validationDetails: {
                dataLoaded: hasZoneData,
                someModelsAssigned: hasAssignedModels,
                noUnassignedModels: totalUnassigned === 0,
                assignmentProcessed: modelsAssignedSuccessfully,
                mappingsSaved: speciesMappingsSaved
            }
        });
        
        // Log validation result for debugging
        if (!isComplete) {
            debug('Validation Failed - Details:', {
                missingData: !hasZoneData,
                noModelsAssigned: !hasAssignedModels && totalUnassigned > 0,
                assignmentNotProcessed: !modelsAssignedSuccessfully && !speciesMappingsSaved
            });
        }
        
        return isComplete;
    }
    
    function validateHeightPrediction() {
        // Height prediction is complete if:
        // 1. The component reports that all zones have complete status, OR
        // 2. It was manually run and has results
        // Priority is given to the component's status check since it's more accurate
        return heightPredictionStatusFromComponent || (heightPredictionResults && heightPredictionResults.predictedHeights > 0);
    }
    
    // Handle height prediction status change from component
    function handleHeightPredictionStatusChange(isComplete: boolean) {
        debug('Height prediction status changed from component:', isComplete);
        heightPredictionStatusFromComponent = isComplete;
    }
    
    function validateSlantedHeightCalculation() {
        // Slanted height calculation is complete if:
        // 1. The component reports that all zones have complete status, OR
        // 2. It was manually run and has results
        // Priority is given to the component's status check since it's more accurate
        return slantedHeightStatusFromComponent || (slantedHeightResults && slantedHeightResults.correctedHeights > 0);
    }
    
    // Handle slanted height calculation status change from component
    function handleSlantedHeightCalculationStatusChange(isComplete: boolean) {
        debug('Slanted height calculation status changed from component:', isComplete);
        slantedHeightStatusFromComponent = isComplete;
    }
    
    // Update HD model for a species
    function updateHdModel(speciesIndex: number, modelId: number) {
        // TODO: Implement HD model update functionality
        debug(`Updating HD model for species index ${speciesIndex} to model ${modelId}`);
    }
    
    // Run height prediction
    async function runHeightPrediction() {
        if (!currentProjectId) return;
        
        isProcessing = true;
        processingMessage = 'Running height prediction models...';
        debug('Starting height prediction');
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_HEIGHT_PREDICTION(currentProjectId);
            debugAPI('POST', url, null, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('Height prediction completed successfully:', data);
                    
                    // Set results and completion status
                    heightPredictionResults = {
                        totalTrees: data.total_trees,
                        predictedHeights: data.updated_count,
                        accuracy: 0.92, // TODO: Calculate actual accuracy
                        rmse: 1.2 // TODO: Calculate actual RMSE
                    };
                    heightPredictionComplete = true;
                    
                    // Refresh height prediction status to show "View H-D Relation" buttons
                    if (refreshHeightPredictionStatus) {
                        refreshHeightPredictionStatus();
                    }
                    
                    // Show success message
                    alert(`Height prediction completed successfully! Updated ${data.updated_count} trees.`);
                } else {
                    debug('Failed to run height prediction:', data.error);
                    alert(`Error running height prediction: ${data.error}`);
                }
            } else {
                debug('Failed to run height prediction:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to run height prediction: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error running height prediction:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error running height prediction: ${errorMessage}`);
        } finally {
            isProcessing = false;
            processingMessage = '';
        }
    }
    
    // Run slanted height calculation
    async function runSlantedHeightCalculation() {
        isProcessing = true;
        processingMessage = 'Calculating slanted tree heights...';
        debug('Starting slanted height calculation (mock)');
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock results
            slantedHeightResults = {
                totalTrees: 150,
                slantedTrees: 23,
                correctedHeights: 23,
                correctionFactor: 0.85
            };
            slantedHeightComplete = true;
            debug('Slanted height calculation completed (mock):', slantedHeightResults);
            
        } catch (error) {
            debug('Error running slanted height calculation:', error);
        } finally {
            isProcessing = false;
            processingMessage = '';
        }
    }
    
    // Assign HD models for a specific physiography zone
    async function assignModelsForZone(phyZone: number) {
        if (phyZone === 0) {
            debug('Assigning HD models for all physiography zones');
        } else {
            debug(`Assigning HD models for physiography zone ${phyZone}`);
        }
        
        isAssigningModels = true; // Set loading state
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_HD_MODEL_ASSIGN_MODELS(currentProjectId);
            debugAPI('POST', url, { phyZone }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('HD models assigned successfully:', data.message);
                    
                    // Update the physiography zone data with new counts
                    if (data.physiography_summary) {
                        physiographyZones = data.physiography_summary;
                        debug('Updated physiography zone summary:', physiographyZones);
                    } else {
                        // If no summary provided, refresh the data
                        await loadPhysiographyZoneData();
                    }
                    
                    // Set success state
                    modelsAssignedSuccessfully = true;
                    
                    // Auto-hide success message after 5 seconds
                    setTimeout(() => {
                        modelsAssignedSuccessfully = false;
                    }, 5000);
                    
                } else {
                    debug('Failed to assign HD models:', data.error);
                    alert(`Error assigning HD models: ${data.error}`);
                }
            } else {
                debug('Failed to assign HD models:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                debug('Error response data:', errorData);
                alert(`Failed to assign HD models: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error assigning HD models:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error assigning HD models: ${errorMessage}`);
        } finally {
            isAssigningModels = false; // Reset loading state
        }
    }
    
    // Load unassigned HD model records for a specific physiography zone
    async function loadUnassignedRecords(phyZone: number, zoneData: any) {
        if (!currentProjectId) return;
        
        selectedPhyZone = phyZone;
        // Store the zone data for display purposes
        selectedPhyZoneData = zoneData;
        // Reset pagination when opening modal
        currentPage = 1;
        // Clear previous save results
        saveResults = [];
        saveSummary = null;
        // Reset saved mappings flag when opening modal for new changes
        speciesMappingsSaved = false;
        isLoadingUnassignedRecords = true;
        showSpeciesHdModelModal = true;
        
        // Load HD models if not already loaded
        await loadHdModels();
        
        try {
            // Handle "All" option - use a very large number to get all records
            const effectivePageSize = pageSize === -1 ? 10000 : pageSize;
            
            // Use the new dedicated API endpoint for unassigned HD model records
            const url = `${API_ENDPOINTS.MRV_PROJECT_HD_MODEL_UNASSIGNED_RECORDS(currentProjectId)}?phy_zone=${phyZone}&page=${currentPage}&page_size=${effectivePageSize}`;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.records) {
                    // Transform the data to match the table structure
                    unassignedRecords = data.records.map((record: any) => ({
                        species_code: record.species_code,
                        species_name: record.species_name,
                        model_name: '', // This will store the HD model code
                        hd_a: '',
                        hd_b: '',
                        hd_c: ''
                    }));
                    
                    // Update pagination info
                    totalRecords = data.total_records || unassignedRecords.length;
                    totalPages = pageSize === -1 ? 1 : Math.ceil(totalRecords / pageSize);
                    
                    debug('Loaded unassigned records:', {
                        records: unassignedRecords,
                        totalRecords,
                        totalPages,
                        pageSize: effectivePageSize,
                        apiResponse: data
                    });
                }
            } else {
                debug('Failed to load unassigned records:', response.status);
                const errorData = await response.json().catch(() => ({}));
                debug('Error response data:', errorData);
            }
        } catch (error) {
            debug('Error loading unassigned records:', error);
        } finally {
            isLoadingUnassignedRecords = false;
        }
    }
    
    // Save all changes to HD model records
    async function saveAllChanges() {
        if (!currentProjectId || !selectedPhyZone) return;
        
        // Filter records that have complete data (HD model + required parameters a and b)
        const recordsToUpdate = unassignedRecords.filter(record => {
            const hasModel = record.model_name && record.model_name !== '';
            const hasA = record.hd_a !== null && record.hd_a !== undefined && record.hd_a !== '';
            const hasB = record.hd_b !== null && record.hd_b !== undefined && record.hd_b !== '';
            
            // Only include records that have HD model AND both a and b parameters
            return hasModel && hasA && hasB;
        });
        
        // No need to check for incomplete records since we're only including complete ones
        
        if (recordsToUpdate.length === 0) {
            alert('No complete records to save. Please select an HD model and enter values for parameters a and b for at least one record.');
            return;
        }
        
        debug('Saving changes for records:', recordsToUpdate);
        
        isSaving = true;
        try {
            // Prepare mappings data for API
            const mappings = recordsToUpdate.map(record => ({
                species_code: record.species_code,
                hd_model_code: record.model_name,
                hd_a: parseFloat(record.hd_a) || 0,
                hd_b: parseFloat(record.hd_b) || 0,
                hd_c: record.hd_c ? parseFloat(record.hd_c) : null,
                phy_zone: selectedPhyZone
            }));
            
            const url = API_ENDPOINTS.MRV_PROJECT_HD_MODEL_UPDATE_SPECIES_MAPPING(currentProjectId);
            const requestData = { mappings };
            debugAPI('POST', url, requestData, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('Species-HD model mappings updated successfully:', data);
                    
                    // Store results for display
                    saveResults = data.results || [];
                    saveSummary = data.summary || {};
                    
                    // Update the unassignedRecords with status information
                    unassignedRecords = unassignedRecords.map(record => {
                        const result = saveResults.find(r => 
                            r.species_code === record.species_code && 
                            r.phy_zone === selectedPhyZone
                        );
                        
                        if (result) {
                            return {
                                ...record,
                                status: result.status,
                                message: result.message
                            };
                        }
                        return record;
                    });
                    
                    // Show success message
                    if (data.summary.errors === 0) {
                        alert(`Successfully saved ${data.summary.successful} mappings!`);
                        // Set flag that mappings have been saved
                        speciesMappingsSaved = true;
                        // Close modal and refresh data
                        showSpeciesHdModelModal = false;
                        await loadPhysiographyZoneData();
                    } else {
                        // Show results with errors - modal stays open
                        alert(`Saved ${data.summary.successful} mappings with ${data.summary.errors} errors. Please review and fix the errors.`);
                    }
                } else {
                    alert(`Error saving changes: ${data.error}`);
                }
            } else {
                debug('Failed to save changes:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to save changes: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error saving changes:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving changes: ${errorMessage}`);
        } finally {
            isSaving = false;
        }
    }
    
    // Load a specific page of unassigned records
    async function loadPage(page: number) {
        if (!currentProjectId || !selectedPhyZone) return;
        
        currentPage = page;
        isLoadingUnassignedRecords = true;
        
        try {
            // Handle "All" option - use a very large number to get all records
            const effectivePageSize = pageSize === -1 ? 10000 : pageSize;
            
            const url = `${API_ENDPOINTS.MRV_PROJECT_HD_MODEL_UNASSIGNED_RECORDS(currentProjectId)}?phy_zone=${selectedPhyZone}&page=${currentPage}&page_size=${effectivePageSize}`;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.records) {
                    unassignedRecords = data.records.map((record: any) => ({
                        species_code: record.species_code,
                        species_name: record.species_name,
                        model_name: '', // This will store the HD model code
                        hd_a: '',
                        hd_b: '',
                        hd_c: ''
                    }));
                    
                    totalRecords = data.total_records || unassignedRecords.length;
                    totalPages = pageSize === -1 ? 1 : Math.ceil(totalRecords / pageSize);
                    
                    debug('Loaded page data:', {
                        page: currentPage,
                        records: unassignedRecords,
                        totalRecords,
                        totalPages,
                        pageSize: effectivePageSize,
                        apiResponse: data
                    });
                }
            }
        } catch (error) {
            debug('Error loading page:', error);
        } finally {
            isLoadingUnassignedRecords = false;
        }
    }
    
    // Show data for a specific physiography zone
    function showZoneData(phyZone: number) {
        debug(`Showing data for physiography zone ${phyZone}`);
        // TODO: Implement data display modal or navigation
        // This could show a table of all trees in this zone with their current HD model assignments
        alert(`Show data for Zone ${phyZone} - Feature coming soon!`);
    }
    
    // Edit models for a specific physiography zone
    function editZoneModels(phyZone: number) {
        debug(`Editing models for physiography zone ${phyZone}`);
        // TODO: Implement model editing modal or navigation
        // This could allow users to change HD model assignments for species in this zone
        alert(`Edit models for Zone ${phyZone} - Feature coming soon!`);
    }
</script>

<div class="min-h-screen bg-slate-50">
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <button onclick={() => {
            // Preserve URL parameters when going back
            const urlProjectId = $page.url.searchParams.get('project');
            const urlProjectName = $page.url.searchParams.get('name');
            let targetUrl = '/mrv/analysis';
            if (urlProjectId) targetUrl += `?project=${urlProjectId}`;
            if (urlProjectName) targetUrl += `${urlProjectId ? '&' : '?'}name=${encodeURIComponent(urlProjectName)}`;
            goto(targetUrl);
          }} class="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft class="h-5 w-5 text-slate-600" />
          </button>
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TreePine class="text-emerald-600" size={24} />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Phase 2: Height-Diameter Modeling</h1>
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
          <HdModelAssignment 
            {currentProjectId}
            {physiographyZones}
            {isLoadingPhysiographyData}
            {isAssigningModels}
            {modelsAssignedSuccessfully}
            {isLoadingUnassignedRecords}
            onloadPhysiographyZoneData={loadPhysiographyZoneData}
            onassignModelsForZone={(e) => assignModelsForZone(e.detail)}
            onshowZoneData={(e) => showZoneData(e.detail)}
          />
          
        {:else if currentStep === 2}
          <HeightPrediction 
            {currentProjectId}
            {physiographyZones}
            {heightPredictionResults}
            {heightPredictionComplete}
            {isProcessing}
            onrunHeightPrediction={runHeightPrediction}
            onrefreshStatus={(refreshFn) => refreshHeightPredictionStatus = refreshFn}
            onHeightPredictionStatusChange={handleHeightPredictionStatusChange}
          />
          
        {:else if currentStep === 3}
          <!-- Step 3: Slanted Tree Height Calculation -->
          <SlantedHeightCalculation 
            {currentProjectId}
            {physiographyZones}
            {slantedHeightComplete}
            {slantedHeightResults}
            {isProcessing}
            onrunSlantedHeightCalculation={runSlantedHeightCalculation}
            onSlantedHeightCalculationStatusChange={handleSlantedHeightCalculationStatusChange}
          />
        {/if}
        
        <!-- Processing Overlay -->
        {#if isProcessing}
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div class="flex items-center gap-3 mb-4">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <span class="font-medium text-slate-900">Processing...</span>
              </div>
              <p class="text-slate-600 text-sm">{processingMessage}</p>
            </div>
          </div>
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
            disabled={
              (currentStep === 1 && !validateHdModelAssignment()) ||
              (currentStep === 2 && !validateHeightPrediction()) ||
              (currentStep === 3 && !validateSlantedHeightCalculation())
            }
            class="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
              (currentStep === 1 && !validateHdModelAssignment()) ||
              (currentStep === 2 && !validateHeightPrediction()) ||
              (currentStep === 3 && !validateSlantedHeightCalculation())
                ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}"
          >
            {currentStep === steps.length ? 'Continue to Volume Ratio Analysis' : 
             currentStep === 1 && !validateHdModelAssignment() ? 
               physiographyZones.length === 0 ? 'Load Data to Continue' :
               !modelsAssignedSuccessfully && !speciesMappingsSaved ? 'Assign HD Models or Save Mappings to Continue' :
               'Complete HD Model Assignment to Continue' :
             currentStep === 2 && !validateHeightPrediction() ? 'Complete Height Prediction to Continue' :
             currentStep === 3 && !validateSlantedHeightCalculation() ? 'Complete Slanted Height Calculation to Continue' :
             'Next Step'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
