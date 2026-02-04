<script lang="ts">
    import { goto } from '$app/navigation';
    import { ArrowLeft, AlertTriangle, CheckCircle, TreePine, Database, Calculator, Leaf, Info, Settings, Zap, Edit } from '@lucide/svelte';
    import { projectStore } from '$lib/stores/projectStore';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    import AllometricAssignmentModal from '$lib/components/carbon-calc/AllometricAssignmentModal.svelte';
    import AllometricAssignment from '$lib/components/carbon-calc/AllometricAssignment.svelte';
    import BiomassAnalysis from '$lib/components/carbon-calc/BiomassAnalysis.svelte';
    
    let currentStep = $state(1);
    let currentProjectId = $state<number>(0);
    let isProcessing = $state<boolean>(false);
    let processingMessage = $state<string>('');
    
    // Step 1: Allometric Equation Assignment
    let allometricAssignmentComplete = $state<boolean>(false);
    let isAssigningAllometric = $state<boolean>(false);
    let allometricModelsAssigned = $state<boolean>(false);
    let physiographyZones = $state<any[]>([]);
    
    // Vol_eqn_id status tracking
    let volEqnIdStatus = $state<{
        trees_with_vol_eqn_id: number;
        trees_missing_vol_eqn_id: number;
        vol_eqn_ids_complete: boolean;
    }>({
        trees_with_vol_eqn_id: 0,
        trees_missing_vol_eqn_id: 0,
        vol_eqn_ids_complete: false
    });
    let allometricModels = $state<any[]>([]);
    let speciesAllometricMappings = $state<Record<number, any>>({});
    let zoneProcessingStatus = $state<Record<number, boolean>>({});
    let zoneResults = $state<Record<number, any>>({});
    
    // Modal state
    let showAllometricAssignmentModal = $state(false);
    let selectedPhyZone = $state(0);
    let selectedPhyZoneData: any = $state(null);
    let unassignedSpecies: any[] = $state([]);
    let isLoadingUnassignedSpecies = $state(false);
    let saveSummary: any = $state(null);
    let pageSize = $state(20);
    let currentPage = $state(1);
    let totalPages = $state(1);
    let totalRecords = $state(0);
    let isSaving = $state(false);
    
    // Step 2: Biomass & Carbon Calculation
    let biomassCalculationComplete = $state<boolean>(false);
    let isCalculatingBiomass = $state<boolean>(false);
    let biomassResults = $state<any>(null);
    let carbonResults = $state<any>(null);
    let calculationSummary = $state<any>(null);
    let calculatedZones = $state<number[]>([]);
    
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
        }
    });
    
    // Load data when project ID changes
    $effect(() => {
        if (currentProjectId > 0) {
            loadAllometricModels();
            checkAllometricAssignmentStatus(); // This now also loads physiography zones
            checkBiomassCalculationStatus();
        }
    });
    
    // Auto-update vol_eqn_id assignments if needed
    $effect(() => {
        if (currentProjectId > 0 && allometricAssignmentComplete && !volEqnIdStatus.vol_eqn_ids_complete && volEqnIdStatus.trees_missing_vol_eqn_id > 0) {
            debug('Auto-updating vol_eqn_id assignments...');
            updateVolEqnIdAssignments();
        }
    });
    
    // Populate zone results when allometric assignment is complete and zones are loaded
    $effect(() => {
        if (allometricAssignmentComplete && physiographyZones.length > 0) {
            debug('Allometric assignment complete - populating zone results to hide assign buttons');
            for (const zone of physiographyZones) {
                if (!zoneResults[zone.phy_zone]) {
                    // For auto-population, we use zone.tree_count as an estimate
                    // The actual count will be updated when user clicks "Assign Allometric Equations"
                    zoneResults[zone.phy_zone] = {
                        assignedSpecies: zone.species_count,
                        totalSpecies: zone.species_count,
                        unassignedSpecies: 0,
                        unassignedSpeciesCodes: [],
                        unassignedSpeciesDetails: [],
                        assignedTrees: zone.tree_count, // This is an estimate - actual count comes from API
                        totalTrees: zone.tree_count, // This is an estimate - actual count comes from API
                        volEqnIdStatus: {
                            trees_with_vol_eqn_id: 0,
                            trees_missing_vol_eqn_id: 0,
                            trees_updated: 0
                        }
                    };
                }
            }
        }
    });
    
    // Load physiography zones from allometric assignment status
    async function loadPhysiographyZones() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_ALLOMETRIC_ASSIGNMENT_STATUS(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    physiographyZones = data.physiography_summary || [];
                    debug('Loaded physiography zones from allometric assignment status:', physiographyZones);
                }
            }
        } catch (error) {
            debug('Error loading physiography zones:', error);
        }
    }
    
    // Load allometric models
    async function loadAllometricModels() {
        try {
            const url = API_ENDPOINTS.MRV_ALLOMETRIC_MODELS;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    allometricModels = data.allometric_models || [];
                    debug('Loaded allometric models:', allometricModels);
                }
            }
        } catch (error) {
            debug('Error loading allometric models:', error);
        }
    }
    
    // Check allometric assignment status
    async function checkAllometricAssignmentStatus() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_ALLOMETRIC_ASSIGNMENT_STATUS(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    allometricAssignmentComplete = data.all_assigned || false;
                    
                    // Store vol_eqn_id status
                    volEqnIdStatus = {
                        trees_with_vol_eqn_id: data.trees_with_vol_eqn_id || 0,
                        trees_missing_vol_eqn_id: data.trees_missing_vol_eqn_id || 0,
                        vol_eqn_ids_complete: data.vol_eqn_ids_complete || false
                    };
                    
                    // Update physiography zones from the same endpoint
                    if (data.physiography_summary) {
                        physiographyZones = data.physiography_summary;
                        debug('Updated physiography zones from allometric assignment status:', physiographyZones);
                    }
                    
                    debug('Allometric assignment status:', allometricAssignmentComplete);
                    debug('Vol_eqn_id status:', volEqnIdStatus);
                    
                    // Show user feedback if vol_eqn_id assignments are incomplete
                    if (allometricAssignmentComplete && !volEqnIdStatus.vol_eqn_ids_complete && volEqnIdStatus.trees_missing_vol_eqn_id > 0) {
                        debug(`Warning: ${volEqnIdStatus.trees_missing_vol_eqn_id} trees missing vol_eqn_id assignments`);
                    }
                }
            }
        } catch (error) {
            debug('Error checking allometric assignment status:', error);
        }
    }
    
    // Update vol_eqn_id assignments by calling allometric assignment for each zone
    async function updateVolEqnIdAssignments() {
        if (!currentProjectId || physiographyZones.length === 0) return;
        
        debug('Starting vol_eqn_id assignment update for all zones...');
        
        try {
            // Call allometric assignment for each zone to trigger vol_eqn_id updates
            for (const zone of physiographyZones) {
                if (zone.phy_zone) {
                    debug(`Updating vol_eqn_id for zone ${zone.phy_zone}...`);
                    await assignAllometricForZone(zone.phy_zone);
                }
            }
            
            // Re-check status after updates
            await checkAllometricAssignmentStatus();
            
            debug('Vol_eqn_id assignment update completed');
        } catch (error) {
            debug('Error updating vol_eqn_id assignments:', error);
        }
    }
    
    // Check biomass calculation status
    async function checkBiomassCalculationStatus() {
        if (!currentProjectId) return;
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_BIOMASS_CALCULATION_STATUS(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success) {
                    biomassCalculationComplete = data.all_calculated || false;
                    debug('Biomass calculation status:', biomassCalculationComplete);
                }
            }
        } catch (error) {
            debug('Error checking biomass calculation status:', error);
        }
    }
    
    // Assign allometric equations for a specific zone
    async function assignAllometricForZone(phyZone: number) {
        if (!currentProjectId) return;
        
        zoneProcessingStatus[phyZone] = true;
        debug(`Starting allometric assignment for zone ${phyZone}`);
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_ALLOMETRIC_ASSIGNMENT(currentProjectId);
            debugAPI('POST', url, { phy_zone: phyZone }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phy_zone: phyZone })
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug(`Allometric assignment completed for zone ${phyZone}:`, data);
                    debug('API response unassigned_species_details:', data.unassigned_species_details);
                    debug('API response vol_eqn_id_status:', data.vol_eqn_id_status);
                    
                    // Use total_trees from API response (already filtered for crown_class < 7)
                    const totalTrees = data.total_trees || 0;
                    
                    // Calculate assigned trees (all trees if all species are assigned, otherwise estimate)
                    const assignedTrees = data.assigned_species === data.total_species ? totalTrees : 
                        Math.round((data.assigned_species / data.total_species) * totalTrees);
                    
                    // Store zone results
                    zoneResults[phyZone] = {
                        totalSpecies: data.total_species || 0,
                        assignedSpecies: data.assigned_species || 0,
                        unassignedSpecies: data.unassigned_species || 0,
                        unassignedSpeciesCodes: data.unassigned_species_codes || [],
                        unassignedSpeciesDetails: data.unassigned_species_details || [],
                        totalTrees: totalTrees,
                        assignedTrees: assignedTrees,
                        volEqnIdStatus: data.vol_eqn_id_status || {}
                    };
                    
                    debug('Stored zone results:', zoneResults[phyZone]);
                    
                    // Reload physiography zones to get updated counts
                    await loadPhysiographyZones();
                    
                    // Check overall assignment status
                    await checkAllometricAssignmentStatus();
                    
                    // Create success message with vol_eqn_id update info
                    let successMessage = `Allometric equations assigned for ${data.physiography_name || `Zone ${phyZone}`}! ${data.assigned_species} species assigned.`;
                    if (data.vol_eqn_id_status && data.vol_eqn_id_status.trees_updated > 0) {
                        successMessage += ` Updated ${data.vol_eqn_id_status.trees_updated} tree records with vol_eqn_id.`;
                    }
                    
                    alert(successMessage);
                } else {
                    debug(`Failed to assign allometric equations for zone ${phyZone}:`, data.error);
                    alert(`Error assigning allometric equations for zone ${phyZone}: ${data.error}`);
                }
            } else {
                debug(`Failed to assign allometric equations for zone ${phyZone}:`, response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to assign allometric equations for zone ${phyZone}: ${errorMessage}`);
            }
        } catch (error) {
            debug(`Error assigning allometric equations for zone ${phyZone}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error assigning allometric equations for zone ${phyZone}: ${errorMessage}`);
        } finally {
            zoneProcessingStatus[phyZone] = false;
        }
    }
    
    // Modal functions
    function openAllometricAssignmentModal(zone: any) {
        selectedPhyZone = zone.phy_zone;
        selectedPhyZoneData = zone;
        showAllometricAssignmentModal = true;
        debug('Opening allometric assignment modal for zone:', zone.phy_zone);
        loadUnassignedSpecies();
    }
    
    function closeAllometricAssignmentModal() {
        showAllometricAssignmentModal = false;
        selectedPhyZone = 0;
        selectedPhyZoneData = null;
        unassignedSpecies = [];
        saveSummary = null;
    }
    
    function handlePageSizeChange(newPageSize: number) {
        pageSize = newPageSize;
        currentPage = 1;
        loadUnassignedSpecies();
    }
    
    function loadPage(page: number) {
        currentPage = page;
        loadUnassignedSpecies();
    }
    
    async function loadUnassignedSpecies() {
        if (!currentProjectId || !selectedPhyZone) return;
        
        isLoadingUnassignedSpecies = true;
        saveSummary = null;
        
        try {
            // Call the allometric assignment API to get unassigned species details
            const url = API_ENDPOINTS.MRV_PROJECT_ALLOMETRIC_ASSIGNMENT(currentProjectId);
            debugAPI('POST', url, { phy_zone: selectedPhyZone }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phy_zone: selectedPhyZone })
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success && data.unassigned_species_details && data.unassigned_species_details.length > 0) {
                    // Create unassigned species records using detailed species information
                    unassignedSpecies = data.unassigned_species_details.map((speciesDetail: any) => ({
                        species_code: speciesDetail.species_code,
                        species_name: speciesDetail.species_name,
                        species: speciesDetail.species,
                        density: '',
                        stem_a: '',
                        stem_b: '',
                        stem_c: '',
                        top_10_a: '',
                        top_10_b: '',
                        top_20_a: '',
                        top_20_b: '',
                        bark_stem_a: '',
                        bark_stem_b: '',
                        bark_top_10_a: '',
                        bark_top_10_b: '',
                        bark_top_20_a: '',
                        bark_top_20_b: '',
                        branch_s: '',
                        branch_m: '',
                        branch_l: '',
                        foliage_s: '',
                        foliage_m: '',
                        foliage_l: '',
                        status: ''
                    }));
                    
                    totalRecords = unassignedSpecies.length;
                    totalPages = Math.ceil(totalRecords / pageSize);
                    
                    debug('Loaded unassigned species from API:', unassignedSpecies);
                } else {
                    debug('No unassigned species found for zone', selectedPhyZone);
                    unassignedSpecies = [];
                    totalRecords = 0;
                    totalPages = 1;
                }
            } else {
                debug('Failed to load unassigned species:', response.status);
                unassignedSpecies = [];
                totalRecords = 0;
                totalPages = 1;
            }
        } catch (error) {
            debug('Error loading unassigned species:', error);
            unassignedSpecies = [];
            totalRecords = 0;
            totalPages = 1;
        } finally {
            isLoadingUnassignedSpecies = false;
        }
    }
    
    async function saveAllAllometricChanges() {
        if (!currentProjectId || !selectedPhyZone) return;
        
        // Filter records that have complete data
        const recordsToUpdate = unassignedSpecies.filter(species => {
            const hasDensity = species.density && species.density !== '';
            const hasStemA = species.stem_a && species.stem_a !== '';
            const hasStemB = species.stem_b && species.stem_b !== '';
            
            return hasDensity && hasStemA && hasStemB;
        });
        
        if (recordsToUpdate.length === 0) {
            alert('No complete records to save. Please enter values for density, stem_a, and stem_b for at least one record.');
            return;
        }
        
        debug('Saving allometric changes for records:', recordsToUpdate);
        
        isSaving = true;
        try {
            // Prepare allometric data for API
            const allometricData = recordsToUpdate.map(species => ({
                species_code: species.species_code,
                density: parseFloat(species.density) || 0,
                stem_a: parseFloat(species.stem_a) || 0,
                stem_b: parseFloat(species.stem_b) || 0,
                stem_c: species.stem_c ? parseFloat(species.stem_c) : null,
                top_10_a: species.top_10_a ? parseFloat(species.top_10_a) : null,
                top_10_b: species.top_10_b ? parseFloat(species.top_10_b) : null,
                top_20_a: species.top_20_a ? parseFloat(species.top_20_a) : null,
                top_20_b: species.top_20_b ? parseFloat(species.top_20_b) : null,
                bark_stem_a: species.bark_stem_a ? parseFloat(species.bark_stem_a) : null,
                bark_stem_b: species.bark_stem_b ? parseFloat(species.bark_stem_b) : null,
                bark_top_10_a: species.bark_top_10_a ? parseFloat(species.bark_top_10_a) : null,
                bark_top_10_b: species.bark_top_10_b ? parseFloat(species.bark_top_10_b) : null,
                bark_top_20_a: species.bark_top_20_a ? parseFloat(species.bark_top_20_a) : null,
                bark_top_20_b: species.bark_top_20_b ? parseFloat(species.bark_top_20_b) : null,
                branch_s: species.branch_s ? parseFloat(species.branch_s) : null,
                branch_m: species.branch_m ? parseFloat(species.branch_m) : null,
                branch_l: species.branch_l ? parseFloat(species.branch_l) : null,
                foliage_s: species.foliage_s ? parseFloat(species.foliage_s) : null,
                foliage_m: species.foliage_m ? parseFloat(species.foliage_m) : null,
                foliage_l: species.foliage_l ? parseFloat(species.foliage_l) : null
            }));
            
            // Call the real API endpoint to save allometric assignments
            const url = API_ENDPOINTS.MRV_PROJECT_SAVE_ALLOMETRIC_ASSIGNMENTS(currentProjectId);
            debugAPI('POST', url, { allometric_data: allometricData }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ allometric_data: allometricData })
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug('Allometric assignments saved successfully:', data);
                    
                    // Set save summary
                    saveSummary = {
                        total: data.total_count || recordsToUpdate.length,
                        successful: data.saved_count || 0,
                        errors: data.errors ? data.errors.length : 0,
                        updatedTreesCount: data.updated_trees_count || 0
                    };
                    
                    // Update species status
                    unassignedSpecies = unassignedSpecies.map(species => {
                        const updated = recordsToUpdate.find(r => r.species_code === species.species_code);
                        if (updated) {
                            return { ...species, status: 'success', message: 'Saved successfully' };
                        }
                        return species;
                    });
                    
                    // Show success message with vol_eqn_id update info
                    let successMessage = data.errors && data.errors.length > 0 
                        ? `Saved ${data.saved_count} of ${data.total_count} allometric assignments. ${data.errors.length} errors occurred.`
                        : `Successfully saved ${data.saved_count} allometric assignments!`;
                    
                    if (data.updated_trees_count && data.updated_trees_count > 0) {
                        successMessage += ` Updated ${data.updated_trees_count} tree records with vol_eqn_id.`;
                    }
                    
                    alert(successMessage);
                    
                    // Show errors if any
                    if (data.errors && data.errors.length > 0) {
                        console.warn('Allometric assignment errors:', data.errors);
                    }
                } else {
                    debug('Failed to save allometric assignments:', data.error);
                    alert(`Error saving allometric assignments: ${data.error}`);
                }
            } else {
                debug('Failed to save allometric assignments:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to save allometric assignments: ${errorMessage}`);
            }
            
        } catch (error) {
            debug('Error saving allometric assignments:', error);
            alert(`Error saving allometric assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            isSaving = false;
        }
    }
    
    // Calculate biomass and carbon for all zones
    async function calculateBiomassAndCarbon() {
        if (!currentProjectId) return;
        
        isCalculatingBiomass = true;
        processingMessage = 'Calculating biomass and carbon estimations...';
        debug('Starting biomass and carbon calculation');
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_BIOMASS_CALCULATION(currentProjectId);
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
                    debug('Biomass and carbon calculation completed successfully:', data);
                    
                    // Set results
                    biomassResults = data.biomass_results || {};
                    carbonResults = data.carbon_results || {};
                    calculationSummary = data.summary || {};
                    biomassCalculationComplete = true;
                    
                    // Show success message
                    alert(`Biomass and carbon calculation completed successfully! Total carbon: ${data.summary?.total_carbon || 0} tons/ha`);
                } else {
                    debug('Failed to calculate biomass and carbon:', data.error);
                    alert(`Error calculating biomass and carbon: ${data.error}`);
                }
            } else {
                debug('Failed to calculate biomass and carbon:', response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to calculate biomass and carbon: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error calculating biomass and carbon:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error calculating biomass and carbon: ${errorMessage}`);
        } finally {
            isCalculatingBiomass = false;
            processingMessage = '';
        }
    }
    
    // Calculate biomass and carbon for a specific zone
    async function calculateBiomassForZone(phyZone: number) {
        if (!currentProjectId) return;
        
        isCalculatingBiomass = true;
        processingMessage = `Calculating biomass and carbon for zone ${phyZone}...`;
        debug(`Starting biomass and carbon calculation for zone ${phyZone}`);
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_BIOMASS_CALCULATION(currentProjectId);
            debugAPI('POST', url, { phy_zone: phyZone }, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phy_zone: phyZone })
            });
            
            if (response.ok) {
                const data = await response.json();
                debugAPI('POST', url, data, 'response');
                
                if (data.success) {
                    debug(`Biomass and carbon calculation completed successfully for zone ${phyZone}:`, data);
                    
                    // Update results
                    biomassResults = data.biomass_results || {};
                    carbonResults = data.carbon_results || {};
                    calculationSummary = data.summary || {};
                    
                    // Add zone to calculated zones list
                    if (!calculatedZones.includes(phyZone)) {
                        calculatedZones = [...calculatedZones, phyZone];
                    }
                    
                    // Check if all zones are now calculated
                    await checkBiomassCalculationStatus();
                    
                    // Show success message
                    alert(`Biomass and carbon calculation completed for zone ${phyZone}! Carbon: ${data.summary?.total_carbon || 0} tons/ha`);
                } else {
                    debug(`Failed to calculate biomass and carbon for zone ${phyZone}:`, data.error);
                    alert(`Error calculating biomass and carbon for zone ${phyZone}: ${data.error}`);
                }
            } else {
                debug(`Failed to calculate biomass and carbon for zone ${phyZone}:`, response.status);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                alert(`Failed to calculate biomass and carbon for zone ${phyZone}: ${errorMessage}`);
            }
        } catch (error) {
            debug(`Error calculating biomass and carbon for zone ${phyZone}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error calculating biomass and carbon for zone ${phyZone}: ${errorMessage}`);
        } finally {
            isCalculatingBiomass = false;
            processingMessage = '';
        }
    }
    
    // Show zone data
    function showZoneData(phyZone: number) {
        // TODO: Implement zone data display functionality
        alert(`Show data for zone ${phyZone} - This functionality will be implemented`);
    }
    
    // Export tree_biometric_calc table to CSV
    async function exportTreeBiometricCalc() {
        if (!currentProjectId) {
            alert('Project ID is required for export');
            return;
        }
        
        try {
            const url = API_ENDPOINTS.MRV_PROJECT_EXPORT_TREE_BIOMETRIC_CALC(currentProjectId);
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            
            if (response.ok) {
                // Get the CSV data as blob
                const blob = await response.blob();
                
                // Create a download link
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                
                // Get filename from Content-Disposition header or use default
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `tree_biometric_calc_${projectData?.name || `project_${currentProjectId}`}.csv`;
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                    if (filenameMatch) {
                        filename = filenameMatch[1];
                    }
                }
                
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                debug('Tree biometric calc data exported successfully');
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                debug('Failed to export tree biometric calc:', errorMessage);
                alert(`Failed to export data: ${errorMessage}`);
            }
        } catch (error) {
            debug('Error exporting tree biometric calc:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error exporting data: ${errorMessage}`);
        }
    }
    
    // Navigate to next step
    async function goToNextStep() {
        if (currentStep === 1) {
            // Validate allometric assignment and vol_eqn_id completeness
            if (!allometricAssignmentComplete) {
                alert('Please complete allometric equation assignments before proceeding.');
                return;
            }
            
            if (!volEqnIdStatus.vol_eqn_ids_complete && volEqnIdStatus.trees_missing_vol_eqn_id > 0) {
                alert(`Please wait for vol_eqn_id assignments to complete. ${volEqnIdStatus.trees_missing_vol_eqn_id} trees still need updates.`);
                return;
            }
            
            // Update project to step 2
            try {
                const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
                const updateData = {
                    current_phase: 4,  // Phase 4 - Carbon Estimation Calculation
                    current_step: 2     // Step 2 - Calculate Biomass & Carbon
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
                        currentStep = 2;
                    }
                }
            } catch (error) {
                debug('Error updating project:', error);
            }
        } else if (currentStep === 2) {
            // Validate biomass calculation
            if (!biomassCalculationComplete) {
                return;
            }
            
            // Update project to next phase
            try {
                const url = API_ENDPOINTS.MRV_UPDATE_PROJECT(currentProjectId);
                const updateData = {
                    current_phase: 5,  // Phase 5 - Next phase (if any)
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
                        debug('Project updated to next phase successfully:', result.project);
                        // Navigate to next phase or show completion message
                        alert('Carbon Estimation Analysis completed successfully!');
                    }
                }
            } catch (error) {
                debug('Error updating project:', error);
            }
        }
    }
    
    // Navigate to previous step
    function goToPreviousStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
    
    
    // Define steps for the process
    const steps = [
        { id: 1, title: 'Assign Allometric', description: 'Map species to biomass equations' },
        { id: 2, title: 'Calculate Biomass', description: 'Compute biomass and carbon estimations' }
    ];

    // Initialize component
    onMount(() => {
        debug('CarbonCalcPage onMount', { currentProjectId, currentStep });
    });
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
            let targetUrl = '/mrv/analysis/vol-calc';
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
            <h1 class="text-2xl font-bold text-slate-900">Phase 4: Carbon Estimation Calculation</h1>
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
        
        <!-- Step 1: Assign Allometric Equations -->
        {#if currentStep === 1}
          <AllometricAssignment 
            {physiographyZones}
            {zoneResults}
            {zoneProcessingStatus}
            onAssignAllometric={assignAllometricForZone}
            onOpenModal={openAllometricAssignmentModal}
          />
        {/if}

        <!-- Step 2: Calculate Biomass & Carbon -->
        {#if currentStep === 2}
          <BiomassAnalysis 
            {biomassCalculationComplete}
            {isCalculatingBiomass}
            {allometricAssignmentComplete}
            {volEqnIdStatus}
            {calculationSummary}
            {physiographyZones}
            {calculatedZones}
            onCalculateBiomass={calculateBiomassAndCarbon}
            onCalculateBiomassForZone={calculateBiomassForZone}
            onShowZoneData={showZoneData}
            onExportTreeBiometricCalc={exportTreeBiometricCalc}
          />
        {/if}
        
        <!-- Navigation -->
        <div class="flex justify-between mt-8">
          <button 
            onclick={() => {
              // Preserve URL parameters when going back
              const urlProjectId = $page.url.searchParams.get('project');
              const urlProjectName = $page.url.searchParams.get('name');
              let targetUrl = '/mrv/analysis/vol-calc';
              if (urlProjectId) targetUrl += `?project=${urlProjectId}`;
              if (urlProjectName) targetUrl += `${urlProjectId ? '&' : '?'}name=${encodeURIComponent(urlProjectName)}`;
              goto(targetUrl);
            }}
            class="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
          >
            Previous Phase
          </button>
          <button 
            onclick={goToNextStep}
            disabled={
              (currentStep === 1 && (!allometricAssignmentComplete || !volEqnIdStatus.vol_eqn_ids_complete)) ||
              (currentStep === 2 && !biomassCalculationComplete)
            }
            class="px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {
              (currentStep === 1 && (!allometricAssignmentComplete || !volEqnIdStatus.vol_eqn_ids_complete)) ||
              (currentStep === 2 && !biomassCalculationComplete)
                ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}"
          >
            {currentStep === steps.length ? 'Analysis Complete!' : 
             currentStep === 1 && !allometricAssignmentComplete ? 'Complete Allometric Assignment to Continue' :
             currentStep === 1 && !volEqnIdStatus.vol_eqn_ids_complete ? 'Complete Vol Eqn ID Assignment to Continue' :
             currentStep === 2 && !biomassCalculationComplete ? 'Complete Biomass Calculation to Continue' :
             'Next Step'}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Processing Overlay -->
    {#if isProcessing || isCalculatingBiomass}
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
  </div>
</div>

<!-- Allometric Assignment Modal -->
<AllometricAssignmentModal 
  showModal={showAllometricAssignmentModal}
  {selectedPhyZone}
  {selectedPhyZoneData}
  {unassignedSpecies}
  {allometricModels}
  isLoadingUnassignedSpecies={isLoadingUnassignedSpecies}
  isLoadingAllometricModels={false}
  {saveSummary}
  {pageSize}
  {currentPage}
  {totalPages}
  {totalRecords}
  {isSaving}
  onclose={closeAllometricAssignmentModal}
  onpageSizeChange={handlePageSizeChange}
  onloadPage={loadPage}
  onsaveAllChanges={saveAllAllometricChanges}
/>
