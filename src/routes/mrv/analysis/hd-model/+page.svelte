<script lang="ts">
    import { goto } from '$app/navigation';
    import { ArrowLeft, AlertTriangle, Database, CheckCircle, TreePine, Ruler, TrendingUp, Calculator } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI, debugComponent, debugState } from '$lib/utils/debug';
    
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
    
    // Step 3: Slanted Tree Height Calculation
    let slantedHeightResults = $state<any>(null);
    let slantedHeightComplete = $state<boolean>(false);
    
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
    
    // Copy text from focused input field
    function copyFromFocusedField() {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        let textToCopy = '';
        
        if (activeElement instanceof HTMLInputElement) {
            // For input fields, copy selected text or all text
            textToCopy = activeElement.value;
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            if (start !== null && end !== null && start !== end) {
                textToCopy = activeElement.value.substring(start, end);
            }
        } else if (activeElement instanceof HTMLSelectElement) {
            // For dropdowns, copy the selected option value (code)
            const selectedOption = activeElement.options[activeElement.selectedIndex];
            textToCopy = selectedOption ? selectedOption.value : '';
        }
        
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                debug('Copied to clipboard:', textToCopy);
            }).catch(err => {
                debug('Failed to copy to clipboard:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
        }
    }
    
    // Paste text to focused field
    async function pasteToFocusedField() {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) return;
            
            if (activeElement instanceof HTMLInputElement) {
                // For input fields, paste the text
                activeElement.value = clipboardText;
                // Trigger change event for Svelte binding
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (activeElement instanceof HTMLSelectElement) {
                // For dropdowns, find and select the option with matching value
                const selectElement = activeElement as HTMLSelectElement;
                let found = false;
                
                for (let i = 0; i < selectElement.options.length; i++) {
                    if (selectElement.options[i].value === clipboardText) {
                        selectElement.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                
                if (found) {
                    // Trigger change event for Svelte binding
                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    debug('Selected dropdown option with value:', clipboardText);
                } else {
                    debug('No dropdown option found with value:', clipboardText);
                }
            }
        } catch (err) {
            debug('Failed to read from clipboard:', err);
        }
    }
    
    // Navigate between input fields using arrow keys in grid pattern (Excel-like)
    function navigateWithArrowKeys(e: KeyboardEvent) {
        const activeElement = document.activeElement;
        if (!activeElement) return;
        
        // Only handle arrow keys when modal is open
        if (!showSpeciesHdModelModal) return;
        
        // // Check if we're in a dropdown that's open
        // if (activeElement instanceof HTMLSelectElement) {
        //     // For dropdowns, only handle up/down when the dropdown list is visible
        //     // We can't easily detect if dropdown is open, so we'll let the browser handle it
        //     // and only prevent our grid navigation from interfering
        //     if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        //         // Let the browser handle dropdown navigation
        //         debug('Dropdown navigation - letting browser handle up/down');
        //         return;
        //     }
        //     // For left/right in dropdowns, we want to navigate to adjacent columns
        //     // So we'll continue with our grid navigation logic
        // }
        
        // Get all focusable elements in the modal
        const modal = document.querySelector('[data-modal="species-hd-model"]');
        if (!modal) return;
        
        // Get only the input/select elements from the table body rows
        const tableRows = modal.querySelectorAll('table tbody tr');
        if (tableRows.length === 0) {
            debug('No table rows found');
            return;
        }
        
        debug('Found table rows:', tableRows.length);
        
        // Build a proper grid structure by iterating through rows
        const grid: HTMLElement[][] = [];
        const columnsPerRow = 4; // HD Model, a, b, c (Status column has no input)
        
        tableRows.forEach((row, rowIndex) => {
            const inputs = Array.from(row.querySelectorAll('td input, td select')).filter(el => {
                const element = el as HTMLElement;
                return !(element as HTMLInputElement | HTMLSelectElement).disabled;
            }) as HTMLElement[];
            
            debug(`Row ${rowIndex}: found ${inputs.length} inputs`);
            
            // Accept rows with exactly 4 inputs (HD Model dropdown + a, b, c inputs)
            if (inputs.length === columnsPerRow) {
                grid[rowIndex] = inputs;
                debug(`Row ${rowIndex} added to grid:`, inputs.map(el => el.tagName + (el instanceof HTMLSelectElement ? ':' + (el as HTMLSelectElement).value : ':' + (el as HTMLInputElement).value)));
            } else {
                debug(`Row ${rowIndex} skipped - expected ${columnsPerRow}, got ${inputs.length}`);
            }
        });
        
        if (grid.length === 0) {
            debug('No valid grid rows found');
            return;
        }
        
        debug('Built grid with rows:', grid.length);
        
        // Debug: Show grid structure
        grid.forEach((row, rowIndex) => {
            debug(`Grid row ${rowIndex}:`, row.map((el, colIndex) => {
                const tag = el.tagName;
                const value = el instanceof HTMLSelectElement ? (el as HTMLSelectElement).value : (el as HTMLInputElement).value;
                return `Col ${colIndex} (${tag}): ${value}`;
            }));
        });
        
        // Find current position in the grid
        let currentRow = -1;
        let currentCol = -1;
        
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col] === activeElement) {
                    currentRow = row;
                    currentCol = col;
                    break;
                }
            }
            if (currentRow !== -1) break;
        }
        
        if (currentRow === -1 || currentCol === -1) {
            debug('Could not find current element in grid. Active element:', activeElement);
            return;
        }
        
        debug('Current position in grid:', currentRow, currentCol);
        
        let nextRow = currentRow;
        let nextCol = currentCol;
        let shouldNavigate = false;
        
        switch (e.key) {
            case 'ArrowRight':
                // Move to next column in same row
                debug(`ArrowRight: currentCol=${currentCol}, columnsPerRow-1=${columnsPerRow-1}`);
                if (currentCol < columnsPerRow - 1) {
                    nextCol = currentCol + 1;
                    shouldNavigate = true;
                    debug(`ArrowRight: will move to col ${nextCol}`);
                } else {
                    debug(`ArrowRight: at rightmost column, cannot move right`);
                }
                break;
            case 'ArrowLeft':
                // Move to previous column in same row
                debug(`ArrowLeft: currentCol=${currentCol}`);
                if (currentCol > 0) {
                    nextCol = currentCol - 1;
                    shouldNavigate = true;
                    debug(`ArrowLeft: will move to col ${nextCol}`);
                } else {
                    debug(`ArrowLeft: at leftmost column, cannot move left`);
                }
                break;
            case 'ArrowDown':
                // Move to same column in next row
                debug(`ArrowDown: currentRow=${currentRow}, grid.length-1=${grid.length-1}`);
                if (currentRow < grid.length - 1) {
                    nextRow = currentRow + 1;
                    shouldNavigate = true;
                    debug(`ArrowDown: will move to row ${nextRow}`);
                } else {
                    debug(`ArrowDown: at bottom row, cannot move down`);
                }
                break;
            case 'ArrowUp':
                // Move to same column in previous row
                debug(`ArrowUp: currentRow=${currentRow}`);
                if (currentRow > 0) {
                    nextRow = currentRow - 1;
                    shouldNavigate = true;
                    debug(`ArrowUp: will move to row ${nextRow}`);
                } else {
                    debug(`ArrowUp: at top row, cannot move up`);
                }
                break;
            default:
                return;
        }
        
        debug('Navigation attempt:', e.key, 'shouldNavigate:', shouldNavigate, 'nextRow:', nextRow, 'nextCol:', nextCol);
        
        // Navigate to the new position if valid
        if (shouldNavigate && grid[nextRow] && grid[nextRow][nextCol]) {
            e.preventDefault();
            grid[nextRow][nextCol].focus();
            debug('Successfully navigated from Row:', currentRow, 'Col:', currentCol, 'to Row:', nextRow, 'Col:', nextCol);
        } else {
            debug('Navigation failed - invalid target or shouldNavigate is false');
            
            // Fallback: try simple array-based navigation
            const allInputs = Array.from(modal.querySelectorAll('table tbody tr td input, table tbody tr td select')).filter(el => {
                const element = el as HTMLElement;
                return !(element as HTMLInputElement | HTMLSelectElement).disabled;
            }) as HTMLElement[];
            
            const currentIndex = allInputs.indexOf(activeElement as HTMLElement);
            if (currentIndex !== -1) {
                let nextIndex = currentIndex;
                
                switch (e.key) {
                    case 'ArrowRight':
                        if (currentIndex % 4 < 3) nextIndex = currentIndex + 1;
                        break;
                    case 'ArrowLeft':
                        if (currentIndex % 4 > 0) nextIndex = currentIndex - 1;
                        break;
                    case 'ArrowDown':
                        if (currentIndex + 4 < allInputs.length) nextIndex = currentIndex + 4;
                        break;
                    case 'ArrowUp':
                        if (currentIndex - 4 >= 0) nextIndex = currentIndex - 4;
                        break;
                }
                
                if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < allInputs.length) {
                    e.preventDefault();
                    allInputs[nextIndex].focus();
                    debug('Fallback navigation successful to index:', nextIndex);
                }
            }
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
        
        // Set up global keyboard event listener for copy, paste, and navigation functionality
        copyEventHandler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                copyFromFocusedField();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                pasteToFocusedField();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                navigateWithArrowKeys(e);
            }
        };
        
        document.addEventListener('keydown', copyEventHandler);
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
                        goto(`/mrv/analysis/volume-ratio?project=${currentProjectId}&name=${encodeURIComponent(projectData?.name || '')}`);
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
        return heightPredictionResults && heightPredictionResults.predictedHeights > 0;
    }
    
    function validateSlantedHeightCalculation() {
        return slantedHeightResults && slantedHeightResults.correctedHeights > 0;
    }
    
    // Update HD model for a species
    function updateHdModel(speciesIndex: number, modelId: number) {
        // TODO: Implement HD model update functionality
        debug(`Updating HD model for species index ${speciesIndex} to model ${modelId}`);
    }
    
    // Run height prediction
    async function runHeightPrediction() {
        isProcessing = true;
        processingMessage = 'Running height prediction models...';
        debug('Starting height prediction (mock)');
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock results
            heightPredictionResults = {
                totalTrees: 150,
                predictedHeights: 150,
                accuracy: 0.92,
                rmse: 1.2
            };
            heightPredictionComplete = true;
            debug('Height prediction completed (mock):', heightPredictionResults);
            
        } catch (error) {
            debug('Error running height prediction:', error);
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
          <button onclick={() => goto('/mrv/analysis')} class="p-2 hover:bg-slate-100 rounded-lg">
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
          <!-- Step 1: Assign HD Model to each species -->
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <TreePine class="text-emerald-600" size={24} />
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Assign Height-Diameter Models</h2>
                <p class="text-slate-600">Select appropriate HD models for each physiography zone and species in your dataset</p>
              </div>
            </div>
            
            <!-- Physiography Zone Overview -->
            <div class="bg-slate-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-slate-900">Overview</h3>
                <div class="flex gap-2">
                  <button 
                    onclick={loadPhysiographyZoneData}
                    disabled={isLoadingPhysiographyData}
                    class="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoadingPhysiographyData ? 'Loading...' : 'Refresh Data'}
                  </button>
                  <button 
                    onclick={() => assignModelsForZone(0)}
                    disabled={isAssigningModels}
                    class="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    {isAssigningModels ? 'Assigning...' : 'Assign All Models'}
                  </button>
                </div>
              </div>
              
              {#if modelsAssignedSuccessfully}
                <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div class="flex items-center gap-2 text-emerald-800">
                    <CheckCircle size={16} />
                    <span class="text-sm font-medium">HD models have been successfully assigned to trees!</span>
                  </div>
                </div>
              {/if}
              
              {#if physiographyZones.some(zone => zone.unassigned_hd_model_count > 0)}
                <div class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div class="flex items-center gap-2 text-amber-800">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">Some trees still have unassigned HD models. This may be due to missing species-HD model mappings.</span>
                  </div>
                </div>
              {/if}
              
              {#if physiographyZones.length > 0 && physiographyZones.every(zone => zone.assigned_hd_model_count === 0)}
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex items-center gap-2 text-red-800">
                    <AlertTriangle size={16} />
                    <span class="text-sm font-medium">No HD models have been assigned. Click on 'Assign All Models' to automatically assign HD models to trees based on species and physiography zone mappings.</span>
                  </div>
                </div>
              {/if}
              
              {#if modelsAssignedSuccessfully}
                <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-center gap-2 text-blue-800 mb-2">
                    <Database size={16} />
                    <span class="text-sm font-medium">Assignment Summary</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-blue-700">Total Assigned:</span>
                      <span class="font-medium text-blue-900 ml-2">
                        {physiographyZones.reduce((sum, zone) => sum + zone.assigned_hd_model_count, 0)}
                      </span>
                    </div>
                    <div>
                      <span class="text-blue-700">Total Unassigned:</span>
                      <span class="font-medium text-blue-900 ml-2">
                        {physiographyZones.reduce((sum, zone) => sum + zone.unassigned_hd_model_count, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              {/if}
              
              {#if isAssigningModels}
                <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-center gap-2 text-blue-800">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span class="text-sm font-medium">Assigning HD models to trees...</span>
                  </div>
                  <div class="mt-2 text-xs text-blue-600">
                    This process updates the hd_model_code column based on species and physiography zone mappings.
                  </div>
                </div>
              {/if}
              
              {#if isLoadingPhysiographyData}
                <div class="flex items-center justify-center py-8">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                  <span class="ml-2 text-slate-600">Loading physiography zone data...</span>
                </div>
              {:else if physiographyZones.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each physiographyZones as zone}
                    <div class="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div class="flex items-center justify-between mb-3">
                        <div>
                          <h4 class="font-medium text-slate-900">{zone.physiography_name}</h4>
                          <p class="text-xs text-slate-500">Zone {zone.phy_zone}</p>
                        </div>
                        <span class="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                          {zone.tree_count} Trees
                        </span>
                      </div>
                      
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-slate-600">Species Count:</span>
                          <span class="font-medium text-slate-900">{zone.species_count}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-600">Total Trees:</span>
                          <span class="font-medium text-slate-900">{zone.tree_count}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-600">Assigned HD Models:</span>
                          <span class="font-medium text-emerald-600">{zone.assigned_hd_model_count} trees</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-600">Unassigned HD Models:</span>
                          <span class="font-medium text-amber-600">{zone.unassigned_hd_model_count} trees</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-600">Unassigned Species:</span>
                          <span class="font-medium text-red-600">{zone.unassigned_species_count || 0}</span>
                        </div>
                      </div>
                      
                      <div class="mt-4 pt-3 border-t border-slate-200">
                        <div class="flex gap-2">
                          <button 
                            onclick={() => showZoneData(zone.phy_zone)}
                            class="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition-colors"
                          >
                            Show Data
                          </button>
                          <button 
                            onclick={() => loadUnassignedRecords(zone.phy_zone, zone)}
                            disabled={isLoadingUnassignedRecords}
                            class="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                          >
                            {isLoadingUnassignedRecords ? 'Loading...' : 'Update species-HD model'}
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8 text-slate-500">
                  <Database class="h-12 w-12 mx-auto mb-3 text-slate-500" />
                  <p>No physiography zone data available</p>
                  <p class="text-sm">Click "Refresh Data" to load data from the database</p>
                </div>
              {/if}
            </div>
          </div>
          
        {:else if currentStep === 2}
          <!-- Step 2: Predict Tree Height -->
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <Ruler class="text-emerald-600" size={24} />
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Predict Tree Heights</h2>
                <p class="text-slate-600">Generate height predictions using the assigned HD models</p>
              </div>
            </div>
            
            {#if !heightPredictionComplete}
              <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div class="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={20} />
                  <span class="font-medium">Height prediction not yet completed</span>
                </div>
                <p class="text-amber-700 mt-2">Click the button below to run height prediction models for all species.</p>
                <button 
                  onclick={runHeightPrediction}
                  disabled={isProcessing}
                  class="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Run Height Prediction'}
                </button>
              </div>
            {:else}
              <!-- Height Prediction Results -->
              <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div class="flex items-center gap-2 text-emerald-800 mb-3">
                  <CheckCircle size={20} />
                  <span class="font-medium">Height prediction completed successfully!</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{heightPredictionResults.totalTrees}</div>
                    <div class="text-sm text-emerald-700">Total Trees</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{heightPredictionResults.predictedHeights}</div>
                    <div class="text-sm text-emerald-700">Predicted Heights</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{(heightPredictionResults.accuracy * 100).toFixed(1)}%</div>
                    <div class="text-sm text-emerald-700">Accuracy</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{heightPredictionResults.rmse}m</div>
                    <div class="text-sm text-emerald-700">RMSE</div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
        {:else if currentStep === 3}
          <!-- Step 3: Slanted Tree Height Calculation -->
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <Calculator class="text-emerald-600" size={24} />
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Slanted Tree Height Calculation</h2>
                <p class="text-slate-600">Calculate corrected heights for trees that are not perfectly vertical</p>
              </div>
            </div>
            
            {#if !slantedHeightComplete}
              <div class="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div class="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={20} />
                  <span class="font-medium">Slanted height calculation not yet completed</span>
                </div>
                <p class="text-amber-700 mt-2">Click the button below to calculate corrected heights for slanted trees.</p>
                <div class="mt-2 p-3 bg-amber-100 rounded border border-amber-300">
                  <p class="text-sm text-amber-800 font-medium mb-1">Calculation Criteria:</p>
                  <ul class="text-xs text-amber-700 space-y-1">
                    <li>Only trees with height &gt; 0</li>
                    <li>Only trees with crown class &lt; 6</li>
                  </ul>
                </div>
                <button 
                  onclick={runSlantedHeightCalculation}
                  disabled={isProcessing}
                  class="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Calculate Slanted Heights'}
                </button>
              </div>
            {:else}
              <!-- Slanted Height Results -->
              <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div class="flex items-center gap-2 text-emerald-800 mb-3">
                  <CheckCircle size={20} />
                  <span class="font-medium">Slanted height calculation completed successfully!</span>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{slantedHeightResults.totalTrees}</div>
                    <div class="text-sm text-emerald-700">Total Trees</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{slantedHeightResults.slantedTrees}</div>
                    <div class="text-sm text-emerald-700">Slanted Trees</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{slantedHeightResults.correctedHeights}</div>
                    <div class="text-sm text-emerald-700">Corrected Heights</div>
                  </div>
                  <div class="bg-white rounded-lg p-3 border border-emerald-200">
                    <div class="text-2xl font-bold text-emerald-900">{slantedHeightResults.correctionFactor}</div>
                    <div class="text-sm text-emerald-700">Correction Factor</div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
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
              (currentStep === 2 && !heightPredictionComplete) ||
              (currentStep === 3 && !slantedHeightComplete)
            }
            class="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
              (currentStep === 1 && !validateHdModelAssignment()) ||
              (currentStep === 2 && !heightPredictionComplete) ||
              (currentStep === 3 && !slantedHeightComplete)
                ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}"
          >
            {currentStep === steps.length ? 'Continue to Volume Ratio Analysis' : 
             currentStep === 1 && !validateHdModelAssignment() ? 
               physiographyZones.length === 0 ? 'Load Data to Continue' :
               !modelsAssignedSuccessfully && !speciesMappingsSaved ? 'Assign HD Models or Save Mappings to Continue' :
               'Complete HD Model Assignment to Continue' :
             currentStep === 2 && !heightPredictionComplete ? 'Complete Height Prediction to Continue' :
             currentStep === 3 && !slantedHeightComplete ? 'Complete Slanted Height Calculation to Continue' :
             'Next Step'}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Species-HD Model Modal -->
{#if showSpeciesHdModelModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-6xl mx-4 max-h-[90vh] overflow-hidden" data-modal="species-hd-model">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <TreePine class="h-5 w-5 text-emerald-600" />
          Update Species-HD Model for {selectedPhyZoneData?.physiography_name || selectedPhyZone}
        </h3>
        <button 
          onclick={() => showSpeciesHdModelModal = false}
          class="p-2 hover:bg-slate-100 rounded-lg"
        >
          <span class="sr-only">Close</span>
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      {#if isLoadingUnassignedRecords || isLoadingHdModels}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span class="ml-2 text-slate-600">
            {isLoadingUnassignedRecords ? 'Loading unassigned records...' : 'Loading HD models...'}
          </span>
        </div>
      {:else if unassignedRecords.length > 0}
        <!-- Save Results Summary -->
        {#if saveSummary}
          <div class="mb-4 p-4 border rounded-lg {
            saveSummary.errors === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }">
            <div class="flex items-center gap-2 mb-2">
              {#if saveSummary.errors === 0}
                <CheckCircle class="h-5 w-5 text-green-600" />
                <span class="font-medium text-green-800">Save Completed Successfully</span>
              {:else}
                <AlertTriangle class="h-5 w-5 text-amber-600" />
                <span class="font-medium text-amber-800">Save Completed with Errors</span>
              {/if}
            </div>
            <div class="text-sm text-slate-700">
              <p>Total: {saveSummary.total} | Successful: {saveSummary.successful} | Errors: {saveSummary.errors}</p>
              {#if saveSummary.errors > 0}
                <p class="mt-1 text-amber-700">Please review and fix the errors below, then save again.</p>
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- Page Size Selector -->
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <label for="pageSize" class="text-sm font-medium text-slate-700">Show:</label>
            <select 
              id="pageSize"
              bind:value={pageSize}
              onchange={() => {
                currentPage = 1;
                loadUnassignedRecords(selectedPhyZone, selectedPhyZoneData);
              }}
              class="pl-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
            <span class="text-sm text-slate-600">records per page</span>
          </div>
        </div>
        
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Species Code</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Species Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">HD Model</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">a</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">b</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 tracking-wider w-32">c</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Status</th>
                </tr>
              </thead>
            </table>
          </div>
          
          <!-- Scrollable table body with fixed height -->
          <div class="max-h-96 overflow-y-auto">
            <table class="min-w-full divide-y divide-slate-200">
              <tbody class="bg-white divide-y divide-slate-200">
                {#each unassignedRecords as record, index}
                  <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 w-24">{record.species_code}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 w-48">{record.species_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-40">
                      <select 
                        bind:value={record.model_name}
                        class="w-full pl-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select HD Model</option>
                        {#if hdModels.length > 0}
                          {#each hdModels as hdModel}
                            <option value={hdModel.code}>{hdModel.code}-{hdModel.name}</option>
                          {/each}
                        {:else}
                          <option value="" disabled>No HD models available</option>
                        {/if}
                      </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={record.hd_a}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="a"
                      />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={record.hd_b}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="b"
                      />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 w-32">
                      <input 
                        type="number" 
                        step="0.001"
                        bind:value={record.hd_c}
                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                        placeholder="c"
                      />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm w-48">
                      {#if record.status}
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-1 text-xs rounded-full font-medium {
                            record.status === 'created' ? 'bg-green-100 text-green-800' :
                            record.status === 'updated' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'
                          }">
                            {record.status}
                          </span>
                          <span class="text-xs text-slate-600" title={record.message}>
                            {record.message}
                          </span>
                        </div>
                      {:else}
                        <span class="text-slate-400 text-xs">Not saved</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination Controls -->
        {#if totalPages > 1 && pageSize !== -1}
          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-slate-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div class="flex items-center gap-2">
              <button 
                onclick={() => loadPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingUnassignedRecords}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return pageNum;
                } else if (currentPage <= 3) {
                  return pageNum;
                } else if (currentPage >= totalPages - 2) {
                  return totalPages - 4 + pageNum;
                } else {
                  return currentPage - 2 + pageNum;
                }
              }) as pageNum}
                <button 
                  onclick={() => loadPage(pageNum)}
                  disabled={pageNum === currentPage || isLoadingUnassignedRecords}
                  class="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed {
                    pageNum === currentPage 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }"
                >
                  {pageNum}
                </button>
              {/each}
              
              <button 
                onclick={() => loadPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingUnassignedRecords}
                class="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        {:else if pageSize === -1}
          <div class="mt-4 text-center text-sm text-slate-600">
            Showing all {totalRecords} records
          </div>
        {/if}
      {:else}
        <div class="text-center py-8 text-slate-500">
          <CheckCircle class="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <p>All HD models have been assigned for this zone!</p>
        </div>
      {/if}
      
      <!-- Save Changes Button -->
      {#if unassignedRecords.some(record => record.model_name || record.hd_a || record.hd_b || record.hd_c)}
        <div class="mt-6 flex justify-end gap-3">
          <button 
            onclick={() => showSpeciesHdModelModal = false}
            class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Close
          </button>
          <button 
            onclick={saveAllChanges}
            disabled={isSaving}
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {#if isSaving}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            {:else}
              Save Changes
            {/if}
          </button>
        </div>
      {:else}
        <div class="mt-6 flex justify-end">
          <button 
            onclick={() => showSpeciesHdModelModal = false}
            class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}