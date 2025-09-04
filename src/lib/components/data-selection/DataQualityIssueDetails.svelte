<script lang="ts">
    import { X, Filter, Search, Edit, Save, AlertTriangle, CheckCircle, Database } from '@lucide/svelte';
    import { onMount } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI, debugComponent, debugPerformance, debugError, debugWarn } from '$lib/utils/debug.js';

    // Props
    let { 
        projectId = $bindable<number>(0),
        issue = $bindable<any>(null),
        isVisible = $bindable<boolean>(false),
        onClose = $bindable<() => void>(() => {}),
        onCorrectionComplete = $bindable<() => void>(() => {})
    } = $props();

    // State
    let issueData = $state<any[]>([]);
    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let filters = $state({
        plotCode: '',
        phyZone: '',
        treeNo: '',
        issueFilter: ''
    });
    let selectedRecords = $state<Set<number>>(new Set());
    let bulkUpdateValue = $state('');
    let isUpdating = $state(false);
    
    // Pagination state
    let currentPage = $state(1);
    let pageSize = $state(50);
    let totalCount = $state(0);
    let totalPages = $state(0);
    let hasNext = $state(false);
    let hasPrevious = $state(false);
    let startRecord = $state(0);
    let endRecord = $state(0);
    
    // Plot code input state for individual record editing
    let editingRecord = $state<number | null>(null);
    let editingValue = $state('');
    
    // Physiography options for dropdown
    let physiographyOptions = $state<any[]>([]);
    let isLoadingPhysiography = $state(false);
    
    // Issue filter options for dropdown
    let issueFilterOptions = $state<any[]>([]);
    let isLoadingIssueFilters = $state(false);
    
    // Species options for dropdown
    let speciesOptions = $state<any[]>([]);
    let isLoadingSpecies = $state(false);
    let speciesSearchTerm = $state('');
    let showSpeciesDropdown = $state(false);
    
    // Ignore functionality
    let isIgnoring = $state(false);
    let ignoredRecords = $state<any[]>([]);
    let ignoredTotalCount = $state(0);
    let ignoredCurrentPage = $state(1);
    let ignoredTotalPages = $state(0);
    
    // Tab state
    let activeTab = $state<'issues' | 'ignored'>('issues');
    
    // Auto-hide messages
    let messageTimeout: number | null = null;

    // Load issue data when component becomes visible
    $effect(() => {
        debugComponent('DataQualityIssueDetails', 'effect triggered', { isVisible, issue, projectId });
        if (isVisible && issue && projectId) {
            debugComponent('DataQualityIssueDetails', 'modal visible', { issueType: issue.type });
            loadIssueData();
            loadPhysiographyOptions();
            loadIssueFilterOptions();
            if (issue.type === 'species_code') {
                loadSpeciesOptions();
            }
        }
    });
    
    // Auto-apply filters when filter values change
    $effect(() => {
        if (isVisible && issue && projectId) {
            debugComponent('DataQualityIssueDetails', 'filters changed', filters);
            currentPage = 1; // Reset to first page on filter change
            loadIssueData();
            loadPhysiographyOptions();
            loadIssueFilterOptions();
            if (issue.type === 'species_code') {
                loadSpeciesOptions();
            }
        }
    });
    
    // Cleanup timeout when component is destroyed
    onMount(() => {
        return () => {
            if (messageTimeout) {
                clearTimeout(messageTimeout);
            }
        };
    });

    // Load data for the specific issue
    async function loadIssueData() {
        if (!projectId || !issue) return null;

        const startTime = performance.now();
        isLoading = true;
        errorMessage = '';

        try {
            debug('DataQualityIssueDetails', `Loading issue data for ${issue.type}`, { filters, projectId });
            
            // Add a filter to exclude ignored records from the main issues table
            const requestFilters = {
                ...filters,
                exclude_ignored: true  // This will tell the backend to exclude ignored records
            };
            
            const url = API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_ISSUE_DETAILS(projectId, issue.type);
            const requestData = {
                filters: requestFilters,
                page: currentPage,
                page_size: pageSize
            };
            
            debugAPI('POST', url, requestData, 'request');
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to load issue data: ${response.statusText}`);
            }

            const data = await response.json();
            debugAPI('POST', url, data, 'response');
            
            // Update state
            issueData = data.details?.records || [];
            totalCount = data.details?.total_count || 0;
            totalPages = data.details?.total_pages || 0;
            hasNext = data.details?.has_next || false;
            hasPrevious = data.details?.has_previous || false;
            startRecord = data.details?.start_record || 0;
            endRecord = data.details?.end_record || 0;
            
            debug('DataQualityIssueDetails', `Loaded ${issueData.length} records for ${issue.type}`, {
                page: currentPage,
                pageSize,
                totalCount,
                totalPages,
                hasNext,
                hasPrevious,
                startRecord,
                endRecord
            });

            return data.details;

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error loading issue data', error);
            showMessage(error instanceof Error ? error.message : 'Failed to load issue data.', 'error');
            return null;
        } finally {
            isLoading = false;
            debugPerformance('DataQualityIssueDetails - loadIssueData', startTime);
        }
    }

    // Load physiography options for dropdown
    async function loadPhysiographyOptions() {
        if (!projectId || !issue) return;

        isLoadingPhysiography = true;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PHYSIOGRAPHY_LIST, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to load physiography options: ${response.statusText}`);
            }

            const data = await response.json();
            physiographyOptions = data.physiography || [];
            
            debug('DataQualityIssueDetails', 'Physiography options loaded', { count: physiographyOptions.length });

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error loading physiography options', error);
            showMessage(error instanceof Error ? error.message : 'Failed to load physiography options.', 'error');
        } finally {
            isLoadingPhysiography = false;
        }
    }
    
    // Load issue filter options for dropdown
    async function loadIssueFilterOptions() {
        if (!projectId || !issue) return;

        isLoadingIssueFilters = true;

        try {
            // Get a sample of records to extract filter options
            // Using a reasonable page size within backend limits
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_ISSUE_DETAILS(projectId, issue.type), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filters: { ...filters, issueFilter: '', exclude_ignored: true }, // Exclude ignored records and issue filter
                    page: 1,
                    page_size: 500 // Use a reasonable sample size within the 1000 limit
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to load issue filter options: ${response.statusText}`);
            }

            const data = await response.json();
            const sampleRecords = data.details?.records || [];
            
            // Extract unique values based on issue type from the sample
            let uniqueValues: any[] = [];
            
            if (issue.type === 'phy_zone') {
                // For phy_zone, use the actual phy_zone values
                uniqueValues = [...new Set(sampleRecords.map((record: any) => record.phy_zone).filter((val: any) => val !== null))];
            } else if (issue.type === 'species_code') {
                // For species_code, use the actual species_code values
                uniqueValues = [...new Set(sampleRecords.map((record: any) => record.species_code).filter((val: any) => val !== null))];
            } else if (issue.type === 'tree_no') {
                // For tree_no, use the actual tree_no values
                uniqueValues = [...new Set(sampleRecords.map((record: any) => record.tree_no).filter((val: any) => val !== null))];
            } else if (issue.type === 'dbh') {
                // For dbh, use the actual dbh values
                uniqueValues = [...new Set(sampleRecords.map((record: any) => record.dbh).filter((val: any) => val !== null))];
            } else if (issue.type === 'plot_code') {
                // For plot_code, use the actual plot_code values
                uniqueValues = [...new Set(sampleRecords.map((record: any) => record.plot_code).filter((val: any) => val !== null))];
            }
            
            // Convert to options format and limit to a reasonable number for UI performance
            issueFilterOptions = uniqueValues
                .slice(0, 50) // Limit to first 50 unique values for UI performance
                .map((value: any) => ({
                    value: value,
                    label: value?.toString() || 'Invalid'
                }));
            
            debug('DataQualityIssueDetails', 'Issue filter options loaded', { 
                count: issueFilterOptions.length,
                issueType: issue.type 
            });

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error loading issue filter options', error);
            showMessage(error instanceof Error ? error.message : 'Failed to load issue filter options.', 'error');
        } finally {
            isLoadingIssueFilters = false;
        }
    }
    
    // Load species options for dropdown
    async function loadSpeciesOptions() {
        if (!projectId || !issue || issue.type !== 'species_code') return;

        isLoadingSpecies = true;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_FOREST_SPECIES_LIST, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to load species options: ${response.statusText}`);
            }

            const data = await response.json();
            speciesOptions = data.species || [];
            
            debug('DataQualityIssueDetails', 'Species options loaded', { count: speciesOptions.length });

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error loading species options', error);
            showMessage(error instanceof Error ? error.message : 'Failed to load species options.', 'error');
        } finally {
            isLoadingSpecies = false;
        }
    }
    
    // Clear filters
    function clearFilters() {
        filters = {
            plotCode: '',
            phyZone: '',
            treeNo: '',
            issueFilter: ''
        };
        // The effect will automatically handle reloading data when filters change
        debug('DataQualityIssueDetails', 'Clearing filters', filters);
    }

    // Handle record selection
    function toggleRecordSelection(recordId: number) {
        const newSelection = new Set(selectedRecords);
        if (newSelection.has(recordId)) {
            newSelection.delete(recordId);
        } else {
            newSelection.add(recordId);
        }
        selectedRecords = newSelection;
    }

    // Select all records
    function selectAllRecords() {
        selectedRecords = new Set(issueData.map(record => record.calc_id));
    }

    // Clear selection
    function clearSelection() {
        selectedRecords = new Set();
        bulkUpdateValue = '';
        if (issue && issue.type === 'species_code') {
            speciesSearchTerm = '';
        }
    }

    // Update individual record
    async function updateRecord(recordId: number, field: string, value: any) {
        if (!projectId || !issue) return;

        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_UPDATE_RECORD(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    record_id: recordId,
                    issue_type: issue.type,
                    field: field,
                    value: value
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to update record: ${response.statusText}`);
            }

            debug('DataQualityIssueDetails', `Record ${recordId} updated successfully`, { recordId, field, value });
            
            // Reload data with pagination adjustment
            await reloadDataWithPaginationAdjustment();
            
            showMessage('Record updated successfully!', 'success');

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error updating record', error);
            showMessage(error instanceof Error ? error.message : 'Failed to update record.', 'error');
        }
    }

    // Bulk update selected records
    async function bulkUpdateRecords() {
        if (!projectId || !issue || selectedRecords.size === 0 || !bulkUpdateValue) return;

        isUpdating = true;
        errorMessage = '';

        try {
            let processedValue: any = bulkUpdateValue;
            
            if (issue.type === 'tree_no' || issue.type === 'phy_zone' || issue.type === 'dbh') {
                const numValue = Number(bulkUpdateValue);
                if (isNaN(numValue)) {
                    showMessage(`${getFieldDisplayName(issue.type)} must be a valid number`, 'error');
                    isUpdating = false;
                    return;
                }
                processedValue = numValue;
            }

            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_BULK_UPDATE(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    issue_type: issue.type,
                    record_ids: Array.from(selectedRecords),
                    value: processedValue
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to bulk update: ${response.statusText}`);
            }

            const updatedCount = selectedRecords.size;
            
            debug('DataQualityIssueDetails', `Bulk updated ${updatedCount} records`, { 
                updatedCount, 
                issueType: issue.type, 
                value: processedValue 
            });
            
            // Reload data with pagination adjustment
            await reloadDataWithPaginationAdjustment();
            
            selectedRecords = new Set();
            bulkUpdateValue = '';
            if (issue.type === 'species_code') {
                speciesSearchTerm = '';
            }
            showMessage(`${updatedCount} records updated successfully!`, 'success');

        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error bulk updating records', error);
            showMessage(error instanceof Error ? error.message : 'Failed to bulk update records.', 'error');
        } finally {
            isUpdating = false;
        }
    }
    
    // Ignore records functionality
    async function ignoreSelectedRecords() {
        if (selectedRecords.size === 0) return;
        
        isIgnoring = true;
        errorMessage = '';
        
        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_IGNORE_RECORDS(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    record_ids: Array.from(selectedRecords)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to ignore records: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the ignored count in the issue object
            if (issue && issue.ignored_count !== undefined) {
                issue.ignored_count = (issue.ignored_count || 0) + data.ignored_count;
            }
            
            showMessage(`Successfully ignored ${data.ignored_count} records.`, 'success');
            
            // Clear selection and reload data
            selectedRecords.clear();
            await loadIssueData();
            
            // Switch to ignored records tab to show the newly ignored records
            activeTab = 'ignored';
            ignoredCurrentPage = 1;
            await loadIgnoredRecords();
            
        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error ignoring records', error);
            showMessage(error instanceof Error ? error.message : 'Failed to ignore records.', 'error');
        } finally {
            isIgnoring = false;
        }
    }
    
    async function ignoreAllRecords() {
        if (issueData.length === 0) return;
        
        isIgnoring = true;
        errorMessage = '';
        
        try {
            const allRecordIds = issueData.map(record => record.calc_id);
            
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_IGNORE_RECORDS(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    record_ids: allRecordIds
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to ignore all records: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the ignored count in the issue object
            if (issue && issue.ignored_count !== undefined) {
                issue.ignored_count = (issue.ignored_count || 0) + data.ignored_count;
            }
            
            showMessage(`Successfully ignored all ${data.ignored_count} records.`, 'success');
            
            // Clear selection and reload data
            selectedRecords.clear();
            await loadIssueData();
            
            // Switch to ignored records tab to show the newly ignored records
            activeTab = 'ignored';
            ignoredCurrentPage = 1;
            await loadIgnoredRecords();
            
        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error ignoring all records', error);
            showMessage(error instanceof Error ? error.message : 'Failed to ignore all records.', 'error');
        } finally {
            isIgnoring = false;
        }
    }
    
    async function loadIgnoredRecords() {
        if (!projectId || !issue) return;
        
        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_IGNORED_RECORDS(projectId, issue.type), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filters: filters,
                    page: ignoredCurrentPage,
                    page_size: pageSize
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to load ignored records: ${response.statusText}`);
            }
            
            const data = await response.json();
            ignoredRecords = data.details?.records || [];
            ignoredTotalCount = data.details?.total_count || 0;
            ignoredTotalPages = data.details?.total_pages || 0;
            
        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error loading ignored records', error);
            showMessage(error instanceof Error ? error.message : 'Failed to load ignored records.', 'error');
        }
    }
    
    async function unignoreRecords(recordIds: number[]) {
        try {
            const response = await fetch(API_ENDPOINTS.MRV_PROJECT_DATA_QUALITY_UNIGNORE_RECORDS(projectId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    record_ids: recordIds
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || `Failed to unignore records: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the ignored count
            if (issue && issue.ignored_count !== undefined) {
                issue.ignored_count = Math.max(0, issue.ignored_count - data.unignored_count);
            }
            
            showMessage(`Successfully unignored ${data.unignored_count} records.`, 'success');
            
            // Reload ignored records to remove the unignored ones
            await loadIgnoredRecords();
            
            // Reload main issue data to show the newly unignored records
            // (they will now appear since they're no longer ignored)
            await loadIssueData();
            
            // Switch back to issues tab to show the unignored records
            activeTab = 'issues';
            
        } catch (error) {
            debugError('DataQualityIssueDetails', 'Error unignoring records', error);
            showMessage(error instanceof Error ? error.message : 'Failed to unignore records.', 'error');
        }
    }
    
    function toggleIgnoredRecordsView() {
        if (activeTab === 'issues') {
            activeTab = 'ignored';
            ignoredCurrentPage = 1;
            loadIgnoredRecords();
        } else {
            activeTab = 'issues';
        }
    }

    // Get field display name
    function getFieldDisplayName(field: string): string {
        switch (field) {
            case 'plot_code':
                return 'Plot Code';
            case 'phy_zone':
                return 'Physiography Zone';
            case 'tree_no':
                return 'Tree Number';
            case 'species_code':
                return 'Species Code';
            case 'dbh':
                return 'DBH';
            default:
                return field;
        }
    }
    
    // Get issue title (alias for getFieldDisplayName for consistency)
    function getIssueTitle(field: string): string {
        return getFieldDisplayName(field);
    }
    
    // Get issue color for UI styling
    function getIssueColor(field: string): string {
        switch (field) {
            case 'plot_code':
                return 'bg-blue-100 text-blue-600';
            case 'phy_zone':
                return 'bg-red-100 text-red-600';
            case 'tree_no':
                return 'bg-yellow-100 text-yellow-600';
            case 'species_code':
                return 'bg-purple-100 text-purple-600';
            case 'dbh':
                return 'bg-orange-100 text-orange-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    }

    // Get field validation rules
    function getFieldValidationRules(field: string): string {
        switch (field) {
            case 'phy_zone':
                return 'Must be between 1-5';
            case 'tree_no':
                return 'Must be greater than 0';
            case 'species_code':
                return 'Must match forest_species table';
            case 'dbh':
                return 'Must be greater than 0';
            default:
                return '';
        }
    }

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }
    
    // Plot code validation and formatting functions
    function validatePlotCodeFormat(value: string): boolean {
        if (!value) return true;
        const plotCodeRegex = /^\d{4}-\d{4}-\d{3}$/;
        return plotCodeRegex.test(value);
    }
    
    function formatPlotCodeInput(value: string): string {
        const digits = value.replace(/\D/g, '');
        
        if (digits.length <= 4) {
            return digits;
        } else if (digits.length <= 8) {
            return `${digits.slice(0, 4)}-${digits.slice(4)}`;
        } else if (digits.length <= 11) {
            return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
        } else {
            return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 11)}`;
        }
    }
    
    function handlePlotCodeInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const formatted = formatPlotCodeInput(target.value);
        target.value = formatted;
        // The binding will automatically update filters.plotCode
        // Filters are applied automatically via the effect when values change
    }
    
    // Start editing a record
    function startEditing(recordId: number, currentValue: any) {
        editingRecord = recordId;
        editingValue = currentValue || '';
        
        // Initialize species search term for species code editing
        if (issue && issue.type === 'species_code' && currentValue) {
            // Find the species in the options to get the display name
            const species = speciesOptions.find(s => s.code === currentValue);
            if (species) {
                speciesSearchTerm = `${species.code} - ${species.species_name || species.name}`;
            } else {
                speciesSearchTerm = currentValue.toString();
            }
        }
    }
    
    // Cancel editing
    function cancelEditing() {
        editingRecord = null;
        editingValue = '';
        if (issue && issue.type === 'species_code') {
            speciesSearchTerm = '';
        }
    }
    
    // Save editing changes
    async function saveEditing() {
        if (editingRecord && editingValue !== undefined) {
            let processedValue: any = editingValue;
            
            if (issue.type === 'tree_no' || issue.type === 'phy_zone' || issue.type === 'dbh') {
                const numValue = Number(editingValue);
                if (isNaN(numValue)) {
                    errorMessage = `${getFieldDisplayName(issue.type)} must be a valid number`;
                    return;
                }
                processedValue = numValue;
            }
            
            await updateRecord(editingRecord, issue.type, processedValue);
            cancelEditing();
        }
    }
    
    // Pagination functions
    function goToPage(page: number) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            loadIssueData();
        }
    }
    
    function nextPage() {
        if (hasNext) {
            currentPage++;
            loadIssueData();
        }
    }
    
    function previousPage() {
        if (hasPrevious) {
            currentPage--;
            loadIssueData();
        }
    }
    
    function changePageSize(newSize: number) {
        pageSize = newSize;
        currentPage = 1; // Reset to first page
        loadIssueData();
    }
    
    // Species dropdown helper functions
    function getFilteredSpeciesOptions() {
        if (!speciesSearchTerm) return speciesOptions;
        return speciesOptions.filter(species => 
            species.code.toString().includes(speciesSearchTerm) ||
            species.species_name?.toLowerCase().includes(speciesSearchTerm.toLowerCase()) ||
            species.scientific_name?.toLowerCase().includes(speciesSearchTerm.toLowerCase()) ||
            species.name?.toLowerCase().includes(speciesSearchTerm.toLowerCase())
        );
    }
    
    function selectSpecies(species: any) {
        editingValue = species.code;
        speciesSearchTerm = `${species.code} - ${species.species_name || species.name}`;
        showSpeciesDropdown = false;
    }
    
    function selectSpeciesForBulk(species: any) {
        bulkUpdateValue = species.code;
        speciesSearchTerm = `${species.code} - ${species.species_name || species.name}`;
        showSpeciesDropdown = false;
    }
    
    function handleSpeciesSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        speciesSearchTerm = target.value;
        showSpeciesDropdown = true;
    }
    
    function handleBulkSpeciesSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        speciesSearchTerm = target.value;
        showSpeciesDropdown = true;
    }
    
    // Close dropdown when clicking outside
    function handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.species-dropdown-container')) {
            showSpeciesDropdown = false;
        }
    }
    
    // Filter panel state
    let isFilterPanelOpen = $state(false);
    
    // Toggle filter panel
    function toggleFilterPanel() {
        isFilterPanelOpen = !isFilterPanelOpen;
    }
    
    // Helper function to reload data with pagination adjustment
    async function reloadDataWithPaginationAdjustment() {
        // Store current page before reloading
        const pageBeforeReload = currentPage;
        
        debug('DataQualityIssueDetails', 'Reloading data with pagination adjustment', { currentPage: pageBeforeReload });
        
        // Reload the current page data and get the response
        const details = await loadIssueData();
        
        debug('DataQualityIssueDetails', 'Loaded data after reload', { 
            recordsCount: details?.records?.length,
            page: pageBeforeReload 
        });
        
        // Check if the current page is now empty and we're not on page 1
        if (details && details.records && details.records.length === 0 && pageBeforeReload > 1) {
            debug('DataQualityIssueDetails', `Page ${pageBeforeReload} is empty, going to previous page ${pageBeforeReload - 1}`);
            // Go to previous page
            currentPage = pageBeforeReload - 1;
            await loadIssueData();
        } else {
            debug('DataQualityIssueDetails', `Page ${pageBeforeReload} has ${details?.records?.length || 0} records, no pagination adjustment needed`);
        }
    }
    
    // Function to show message and auto-hide after 5 seconds
    function showMessage(message: string, type: 'success' | 'error') {
        if (type === 'success') {
            successMessage = message;
            errorMessage = '';
        } else {
            errorMessage = message;
            successMessage = '';
        }
        
        // Clear existing timeout
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }
        
        // Auto-hide after 5 seconds
        messageTimeout = setTimeout(() => {
            if (type === 'success') {
                successMessage = '';
            } else {
                errorMessage = '';
            }
            messageTimeout = null;
        }, 5000);
    }
    
    // Function to check if all issues are resolved (corrected or ignored)
    function areAllIssuesResolved(): boolean {
        if (!issue) return false;
        
        // If there are no issues left (total count is 0), all issues are resolved
        return totalCount === 0;
    }
</script>

{#if isVisible && issue}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2" onclick={handleClickOutside}>
        <div class="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle size={20} class="text-red-600" />
                </div>
                <div>
                    <h2 class="text-xl font-semibold text-slate-900">
                        {issue ? getFieldDisplayName(issue.type) : 'Issue Details'}
                    </h2>
                    <p class="text-sm text-slate-600">
                        {issue ? `${formatNumber(issue.count)} issues found` : ''}
                    </p>
                </div>
            </div>
            <button
                onclick={() => onClose()}
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <X size={20} class="text-slate-600" />
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
            <!-- Filter Button and Sliding Panel -->
            <div class="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <!-- Filter Buttons -->
                <div class="flex items-center gap-2">
                    <button
                        onclick={toggleFilterPanel}
                        class="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
                    >
                        <Filter size={14} />
                        {isFilterPanelOpen ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    
                    {#if isFilterPanelOpen}
                        <button
                            onclick={() => clearFilters()}
                            class="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium transition-colors"
                        >
                            Clear Filters
                        </button>
                    {/if}
                    
                    <!-- View Ignored Records Button -->
                    <button
                        onclick={toggleIgnoredRecordsView}
                        class="flex items-center gap-2 px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
                    >
                        <AlertTriangle size={14} />
                        {activeTab === 'issues' ? 'View Ignored' : 'Hide Ignored'}
                        {#if issue.ignored_count > 0}
                            <span class="px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                                {issue.ignored_count}
                            </span>
                        {/if}
                    </button>
                </div>
                
                <!-- Sliding Filter Panel -->
                <div class="relative overflow-hidden">
                    <div class="transition-all duration-300 ease-in-out {isFilterPanelOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}">
                        <div class="pt-4 space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Plot Code</label>
                                    <input
                                        type="text"
                                        bind:value={filters.plotCode}
                                        oninput={handlePlotCodeInput}
                                        placeholder="0000-0000-000"
                                        maxlength="13"
                                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {#if filters.plotCode && !validatePlotCodeFormat(filters.plotCode)}
                                        <p class="text-xs text-red-600 mt-1">Format: 0000-0000-000 (numbers only)</p>
                                    {/if}
                                </div>
                                
                                <!-- Filter by Issue -->
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Filter by Issue</label>
                                    <select
                                        bind:value={filters.issueFilter}
                                        class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">All Issues</option>
                                        {#if isLoadingIssueFilters}
                                            <option disabled>Loading...</option>
                                        {:else}
                                            {#if issue.type === 'plot_code'}
                                                <option value="missing_col">Missing Plot Column</option>
                                                <option value="missing_row">Missing Plot Row</option>
                                                <option value="missing_number">Missing Plot Number</option>
                                                <option value="invalid_col">Invalid Plot Column (&le;0)</option>
                                                <option value="invalid_row">Invalid Plot Row (&le;0)</option>
                                                <option value="invalid_number">Invalid Plot Number (&le;0)</option>
                                            {:else if issue.type === 'phy_zone'}
                                                <option value="null_zone">Null Physiography Zone</option>
                                                <option value="invalid_zone">Invalid Zone (&lt;1 or &gt;5)</option>
                                            {:else if issue.type === 'tree_no'}
                                                <option value="null_tree">Null Tree Number</option>
                                                <option value="invalid_tree">Invalid Tree Number (&le;0)</option>
                                            {:else if issue.type === 'species_code'}
                                                <option value="null_species">Null Species Code</option>
                                                <option value="invalid_species">Invalid Species Code</option>
                                                
                                                <!-- Dynamic species code values from actual data -->
                                                {#if issueFilterOptions.length > 0}
                                                    <optgroup label="Specific Species Codes">
                                                        {#each issueFilterOptions as option}
                                                            <option value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        {/each}
                                                    </optgroup>
                                                {/if}
                                            {:else if issue.type === 'dbh'}
                                                <option value="null_dbh">Null DBH</option>
                                                <option value="invalid_dbh">Invalid DBH (&le;0)</option>
                                            {/if}
                                            
                                            <!-- Dynamic options from actual data -->
                                            {#if issueFilterOptions.length > 0}
                                                <optgroup label="Specific Values">
                                                    {#each issueFilterOptions as option}
                                                        <option value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    {/each}
                                                </optgroup>
                                            {/if}
                                        {/if}
                                    </select>
                                </div>
                                
                                {#if issue.type !== 'phy_zone'}
                                    <div>
                                        <label class="block text-xs font-medium text-slate-700 mb-1">Physiography Zone</label>
                                        <select
                                            bind:value={filters.phyZone}
                                            class="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">All Physiography Zones</option>
                                            {#if isLoadingPhysiography}
                                                <option disabled>Loading...</option>
                                            {:else}
                                                {#each physiographyOptions as option}
                                                    <option value={option.code}>
                                                        {option.code} - {option.name}
                                                    </option>
                                                {/each}
                                            {/if}
                                        </select>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="border-b border-slate-200 bg-white flex-shrink-0">
                <div class="flex">
                    <button
                        onclick={() => { activeTab = 'issues'; }}
                        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'issues' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
                    >
                        Issues ({formatNumber(totalCount)})
                    </button>
                    <button
                        onclick={() => { 
                            activeTab = 'ignored'; 
                            ignoredCurrentPage = 1; 
                            loadIgnoredRecords(); 
                        }}
                        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'ignored' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
                    >
                        Ignored Records ({formatNumber(issue.ignored_count || 0)})
                    </button>
                </div>
            </div>

            <!-- Tab Content -->
            {#if activeTab === 'issues'}
                <!-- Issues Tab Content -->
                <!-- Messages -->
                {#if errorMessage}
                    <div class="mx-4 mt-2 bg-red-50 border border-red-200 rounded p-2 flex-shrink-0">
                        <div class="flex items-center gap-1 text-red-700">
                            <AlertTriangle size={12} />
                            <span class="font-medium text-xs">Error</span>
                        </div>
                        <p class="text-red-600 text-xs mt-1">{errorMessage}</p>
                    </div>
                {/if}

                {#if successMessage}
                    <div class="mx-4 mt-2 bg-emerald-50 border border-emerald-200 rounded p-2 flex-shrink-0">
                        <div class="flex items-center gap-1 text-emerald-700">
                            <CheckCircle size={12} />
                            <span class="font-medium text-xs">Success</span>
                        </div>
                        <p class="text-emerald-600 text-xs mt-1">{successMessage}</p>
                    </div>
                {/if}

                <!-- Bulk Update Section -->
                {#if selectedRecords.size > 0}
                    <div class="mx-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded flex-shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="flex-1">
                                <label class="block text-xs font-medium text-blue-900 mb-1">
                                    Bulk Update {selectedRecords.size} selected records
                                </label>
                                {#if issue.type === 'phy_zone'}
                                    <select
                                        bind:value={bulkUpdateValue}
                                        class="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Physiography Zone</option>
                                        {#if isLoadingPhysiography}
                                            <option disabled>Loading...</option>
                                        {:else}
                                            {#each physiographyOptions as option}
                                                <option value={option.code}>
                                                    {option.code} - {option.name}
                                                </option>
                                            {/each}
                                        {/if}
                                    </select>
                                {:else if issue.type === 'species_code'}
                                    <div class="relative species-dropdown-container">
                                        <input
                                            type="text"
                                            value={speciesSearchTerm}
                                            oninput={handleBulkSpeciesSearchInput}
                                            onfocus={() => showSpeciesDropdown = true}
                                            placeholder="Search species by code or name..."
                                            class="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        {#if showSpeciesDropdown && speciesOptions.length > 0}
                                            <div class="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {#if isLoadingSpecies}
                                                    <div class="px-3 py-2 text-sm text-slate-500">Loading species...</div>
                                                {:else}
                                                    {#each getFilteredSpeciesOptions().slice(0, 50) as species}
                                                        <button
                                                            type="button"
                                                            onclick={() => selectSpeciesForBulk(species)}
                                                            class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                                                        >
                                                            <div class="font-medium">{species.code} - {species.species_name || species.name}</div>
                                                            {#if species.scientific_name}
                                                                <div class="text-xs text-slate-500 italic">{species.scientific_name}</div>
                                                            {/if}
                                                        </button>
                                                    {/each}
                                                    {#if getFilteredSpeciesOptions().length === 0}
                                                        <div class="px-3 py-2 text-sm text-slate-500">No species found</div>
                                                    {/if}
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <input
                                        type="text"
                                        value={bulkUpdateValue}
                                        oninput={(event) => {
                                            if (issue.type === 'plot_code') {
                                                const target = event.target as HTMLInputElement;
                                                const formatted = formatPlotCodeInput(target.value);
                                                target.value = formatted;
                                                bulkUpdateValue = formatted;
                                            } else {
                                                bulkUpdateValue = (event.target as HTMLInputElement).value;
                                            }
                                        }}
                                        placeholder={issue.type === 'plot_code' ? '0000-0000-000' : 'Enter new value...'}
                                        maxlength={issue.type === 'plot_code' ? 13 : undefined}
                                        class="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                {/if}
                                {#if issue.type === 'plot_code' && bulkUpdateValue && !validatePlotCodeFormat(bulkUpdateValue)}
                                    <p class="text-xs text-red-600 mt-1">Format: 0000-0000-000 (numbers only)</p>
                                {/if}
                            </div>
                            <button
                                onclick={() => bulkUpdateRecords()}
                                disabled={isUpdating || !bulkUpdateValue}
                                class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Updating...' : 'Update All'}
                            </button>
                            
                            <!-- Ignore Actions -->
                            <div class="flex items-center gap-2">
                                <button
                                    onclick={() => ignoreSelectedRecords()}
                                    disabled={isIgnoring || selectedRecords.size === 0}
                                    class="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                                >
                                    {isIgnoring ? 'Ignoring...' : `Ignore Selected (${selectedRecords.size})`}
                                </button>
                                
                                <button
                                    onclick={() => ignoreAllRecords()}
                                    disabled={isIgnoring || issueData.length === 0}
                                    class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors disabled:opacity-50"
                                >
                                    {isIgnoring ? 'Ignoring...' : `Ignore All (${issueData.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Records Table -->
                <div class="flex-1 overflow-hidden p-4 min-h-0 flex flex-col">
                    {#if isLoading}
                        <div class="text-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                            <p class="text-slate-600 mt-2">Loading issue data...</p>
                        </div>
                    {:else if issueData.length === 0}
                        <div class="text-center py-8">
                            <Database size={48} class="mx-auto mb-4 text-slate-300" />
                            <h3 class="text-lg font-medium text-slate-600 mb-2">No Records Found</h3>
                            <p class="text-slate-500">
                                No records match the current filters.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-3">
                            <!-- Table Header -->
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <h3 class="font-medium text-slate-900 text-sm">
                                        {formatNumber(totalCount)} total records with issues
                                    </h3>
                                    <div class="flex items-center gap-2">
                                        <button
                                            onclick={selectAllRecords}
                                            class="text-xs text-emerald-600 hover:text-emerald-700"
                                        >
                                            Select All
                                        </button>
                                        <span class="text-slate-400">|</span>
                                        <button
                                            onclick={clearSelection}
                                            class="text-xs text-slate-600 hover:text-slate-700"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-xs text-slate-600">
                                        {selectedRecords.size} selected
                                    </div>
                                    <div class="text-xs text-slate-500">
                                        Showing {startRecord}-{endRecord} of {formatNumber(totalCount)}
                                    </div>
                                </div>
                            </div>

                            <!-- Records Table -->
                            <div class="bg-white border border-slate-200 rounded overflow-hidden flex-1 flex flex-col min-h-0">
                                <div class="overflow-x-auto flex-1">
                                    <div class="overflow-y-auto h-80">
                                        <table class="w-full">
                                            <thead class="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                                <tr>
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRecords.size === issueData.length}
                                                            onchange={() => selectedRecords.size === issueData.length ? clearSelection() : selectAllRecords()}
                                                            class="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                                        />
                                                    </th>
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Plot Code</th>
                                                    {#if issue.type === 'phy_zone'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Physiography Name</th>
                                                    {:else if issue.type === 'species_code'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tree No</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Species Code</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Species Name</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">DBH</th>
                                                    {:else if issue.type === 'dbh'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tree No</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Species Code</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Species Name</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">DBH</th>
                                                    {:else}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Tree No</th>
                                                    {/if}
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Current Value</th>
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200">
                                                {#each issueData as record}
                                                    <tr class="hover:bg-slate-50">
                                                        <td class="px-3 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRecords.has(record.calc_id)}
                                                                onchange={() => toggleRecordSelection(record.calc_id)}
                                                                class="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                                            />
                                                        </td>
                                                        <td class="px-3 py-2 text-xs text-slate-900">{record.plot_code || 'N/A'}</td>
                                                        {#if issue.type === 'phy_zone'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.physiography_name || 'N/A'}</td>
                                                        {:else if issue.type === 'species_code'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_code || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_name || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.dbh || 'N/A'}</td>
                                                        {:else if issue.type === 'dbh'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_code || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_name || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.dbh || 'N/A'}</td>
                                                        {:else}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                        {/if}
                                                        <td class="px-3 py-2 text-xs text-slate-900">
                                                            <span class="px-1 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                                                                {#if issue.type === 'phy_zone'}
                                                                    {record.phy_zone || 'Invalid'}
                                                                {:else if issue.type === 'species_code'}
                                                                    {record.species_code || 'Invalid'}
                                                                {:else}
                                                                    {record[issue.type] || 'Invalid'}
                                                                {/if}
                                                            </span>
                                                        </td>
                                                        <td class="px-3 py-2">
                                                            {#if editingRecord === record.calc_id}
                                                                <div class="flex items-center gap-2">
                                                                    {#if issue.type === 'phy_zone'}
                                                                        <select
                                                                            bind:value={editingValue}
                                                                            class="px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                                                        >
                                                                            <option value="">Select Zone</option>
                                                                            {#if isLoadingPhysiography}
                                                                                <option disabled>Loading...</option>
                                                                            {:else}
                                                                                {#each physiographyOptions as option}
                                                                                    <option value={option.code}>
                                                                                        {option.code} - {option.name}
                                                                                    </option>
                                                                                {/each}
                                                                            {/if}
                                                                        </select>
                                                                    {:else if issue.type === 'species_code'}
                                                                        <div class="relative species-dropdown-container">
                                                                            <input
                                                                                type="text"
                                                                                value={speciesSearchTerm}
                                                                                oninput={handleSpeciesSearchInput}
                                                                                onfocus={() => showSpeciesDropdown = true}
                                                                                placeholder="Search species..."
                                                                                class="px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-32"
                                                                            />
                                                                            {#if showSpeciesDropdown && speciesOptions.length > 0}
                                                                                <div class="absolute z-50 w-64 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                                                    {#if isLoadingSpecies}
                                                                                        <div class="px-3 py-2 text-sm text-slate-500">Loading species...</div>
                                                                                    {:else}
                                                                                        {#each getFilteredSpeciesOptions().slice(0, 20) as species}
                                                                                            <button
                                                                                                type="button"
                                                                                                onclick={() => selectSpecies(species)}
                                                                                                class="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                                                                                            >
                                                                                                <div class="font-medium">{species.code} - {species.species_name || species.name}</div>
                                                                                                {#if species.scientific_name}
                                                                                                    <div class="text-xs text-slate-500 italic">{species.scientific_name}</div>
                                                                                                {/if}
                                                                                            </button>
                                                                                        {/each}
                                                                                        {#if getFilteredSpeciesOptions().length === 0}
                                                                                            <div class="px-3 py-2 text-sm text-slate-500">No species found</div>
                                                                                        {/if}
                                                                                    {/if}
                                                                                </div>
                                                                            {/if}
                                                                        </div>
                                                                    {:else}
                                                                        <input
                                                                            type="text"
                                                                            value={editingValue}
                                                                            oninput={(event) => {
                                                                                if (issue.type === 'plot_code') {
                                                                                    const target = event.target as HTMLInputElement;
                                                                                    const formatted = formatPlotCodeInput(target.value);
                                                                                    target.value = formatted;
                                                                                    editingValue = formatted;
                                                                                } else {
                                                                                    editingValue = (event.target as HTMLInputElement).value;
                                                                                }
                                                                            }}
                                                                            placeholder={issue.type === 'plot_code' ? '0000-0000-000' : 'Enter value...'}
                                                                            maxlength={issue.type === 'plot_code' ? 13 : undefined}
                                                                            class="px-1 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                                                        />
                                                                    {/if}
                                                                    <button
                                                                        onclick={() => saveEditing()}
                                                                        class="text-emerald-600 hover:text-emerald-700 text-sm"
                                                                    >
                                                                        <Save size={14} />
                                                                    </button>
                                                                    <button
                                                                        onclick={() => cancelEditing()}
                                                                        class="text-slate-600 hover:text-slate-700 text-sm"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            {:else}
                                                                <div class="flex items-center gap-1">
                                                                    <button
                                                                        onclick={() => startEditing(record.calc_id, issue.type === 'phy_zone' ? record.phy_zone : record[issue.type])}
                                                                        class="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                                                                    >
                                                                        <Edit size={12} class="inline mr-1" />
                                                                        Edit
                                                                    </button>
                                                                    
                                                                    <button
                                                                        onclick={() => {
                                                                            selectedRecords.clear();
                                                                            selectedRecords.add(record.calc_id);
                                                                            ignoreSelectedRecords();
                                                                        }}
                                                                        class="text-orange-600 hover:text-orange-700 text-xs font-medium"
                                                                        title="Ignore this record"
                                                                    >
                                                                        <AlertTriangle size={12} class="inline mr-1" />
                                                                        Ignore
                                                                    </button>
                                                                </div>
                                                            {/if}
                                                        </td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <!-- Pagination Controls -->
                                {#if totalPages > 1}
                                    <div class="flex items-center justify-between mt-4 px-4 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-slate-600">Page size:</span>
                                            <select
                                                value={pageSize}
                                                onchange={(event) => changePageSize(Number((event.target as HTMLSelectElement).value))}
                                                class="text-xs border border-slate-300 rounded px-2 py-1"
                                            >
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                                <option value={200}>200</option>
                                            </select>
                                        </div>
                                        
                                        <div class="flex items-center gap-2">
                                            <button
                                                onclick={previousPage}
                                                disabled={!hasPrevious}
                                                class="px-2 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                                            >
                                                Previous
                                            </button>
                                            
                                            <div class="flex items-center gap-1">
                                                {#if totalPages <= 7}
                                                    {#each Array(totalPages) as _, i}
                                                        {@const pageNum = i + 1}
                                                        <button
                                                            onclick={() => goToPage(pageNum)}
                                                            class="px-2 py-1 text-xs border rounded {pageNum === currentPage ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 hover:bg-slate-100'}"
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    {/each}
                                                {:else}
                                                    <!-- First page -->
                                                    <button
                                                        onclick={() => goToPage(1)}
                                                        class="px-2 py-1 text-xs border rounded {currentPage === 1 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 hover:bg-slate-100'}"
                                                    >
                                                        1
                                                    </button>
                                                    
                                                    <!-- Ellipsis if needed -->
                                                    {#if currentPage > 3}
                                                        <span class="px-1 text-xs text-slate-500">...</span>
                                                    {/if}
                                                    
                                                    <!-- Current page and neighbors -->
                                                    {#each Array(Math.min(3, totalPages - 2)) as _, i}
                                                        {@const pageNum = Math.max(2, currentPage - 1) + i}
                                                        {@const shouldShow = pageNum > 1 && pageNum < totalPages}
                                                        {#if shouldShow}
                                                            <button
                                                                onclick={() => goToPage(pageNum)}
                                                                class="px-2 py-1 text-xs border rounded {pageNum === currentPage ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 hover:bg-slate-100'}"
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        {/if}
                                                    {/each}
                                                    
                                                    <!-- Ellipsis if needed -->
                                                    {#if currentPage < totalPages - 2}
                                                        <span class="px-1 text-xs text-slate-500">...</span>
                                                    {/if}
                                                    
                                                    <!-- Last page -->
                                                    {#if totalPages > 1}
                                                        <button
                                                            onclick={() => goToPage(totalPages)}
                                                            class="px-2 py-1 text-xs border rounded {currentPage === totalPages ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 hover:bg-slate-100'}"
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    {/if}
                                                {/if}
                                            </div>
                                            
                                            <button
                                                onclick={nextPage}
                                                disabled={!hasNext}
                                                class="px-2 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        
                                        <div class="text-xs text-slate-600">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else if activeTab === 'ignored'}
                <!-- Ignored Records Tab Content -->
                <div class="flex-1 overflow-hidden p-4 min-h-0 flex flex-col">
                    {#if ignoredRecords.length === 0}
                        <div class="text-center py-8">
                            <AlertTriangle size={48} class="mx-auto mb-4 text-orange-300" />
                            <h3 class="text-lg font-medium text-slate-600 mb-2">No Ignored Records</h3>
                            <p class="text-slate-500">
                                No records have been ignored for this issue type.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-3">
                            <!-- Table Header -->
                            <div class="flex items-center justify-between">
                                <h3 class="font-medium text-slate-900 text-sm">
                                    {formatNumber(ignoredTotalCount)} ignored records
                                </h3>
                                <div class="text-xs text-slate-500">
                                    Showing {((ignoredCurrentPage - 1) * pageSize) + 1}-{Math.min(ignoredCurrentPage * pageSize, ignoredTotalCount)} of {formatNumber(ignoredTotalCount)}
                                </div>
                            </div>

                            <!-- Ignored Records Table -->
                            <div class="bg-white border border-slate-200 rounded overflow-hidden flex-1 flex flex-col min-h-0">
                                <div class="overflow-x-auto flex-1">
                                    <div class="overflow-y-auto h-80">
                                        <table class="w-full">
                                            <thead class="bg-orange-50 border-b border-slate-200 sticky top-0 z-10">
                                                <tr>
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plot Code</th>
                                                    {#if issue.type === 'phy_zone'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Physiography Name</th>
                                                    {:else if issue.type === 'species_code'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tree No</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Code</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Name</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DBH</th>
                                                    {:else if issue.type === 'dbh'}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tree No</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Code</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Species Name</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DBH</th>
                                                    {:else}
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phy Zone</th>
                                                        <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tree No</th>
                                                    {/if}
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Value</th>
                                                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200">
                                                {#each ignoredRecords as record}
                                                    <tr class="hover:bg-orange-50">
                                                        <td class="px-3 py-2 text-xs text-slate-900">{record.plot_code || 'N/A'}</td>
                                                        {#if issue.type === 'phy_zone'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.physiography_name || 'N/A'}</td>
                                                        {:else if issue.type === 'species_code'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_code || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_name || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.dbh || 'N/A'}</td>
                                                        {:else if issue.type === 'dbh'}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_code || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.species_name || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.dbh || 'N/A'}</td>
                                                        {:else}
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.phy_zone || 'N/A'}</td>
                                                            <td class="px-3 py-2 text-xs text-slate-900">{record.tree_no || 'N/A'}</td>
                                                        {/if}
                                                        <td class="px-3 py-2 text-xs text-slate-900">
                                                            <span class="px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                                                                {#if issue.type === 'phy_zone'}
                                                                    {record.phy_zone || 'Invalid'}
                                                                {:else if issue.type === 'species_code'}
                                                                    {record.species_code || 'Invalid'}
                                                                {:else}
                                                                    {record[issue.type] || 'Invalid'}
                                                                {/if}
                                                            </span>
                                                        </td>
                                                        <td class="px-3 py-2">
                                                            <button
                                                                onclick={() => unignoreRecords([record.calc_id])}
                                                                class="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                                                                title="Unignore this record"
                                                            >
                                                                <CheckCircle size={12} class="inline mr-1" />
                                                                Unignore
                                                            </button>
                                                        </td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Ignored Records Pagination -->
                            {#if ignoredTotalPages > 1}
                                <div class="flex items-center justify-between mt-4 px-4 py-3 bg-orange-50 border-t border-slate-200 flex-shrink-0">
                                    <div class="flex items-center gap-2">
                                        <button
                                            onclick={() => { ignoredCurrentPage = Math.max(1, ignoredCurrentPage - 1); loadIgnoredRecords(); }}
                                            disabled={ignoredCurrentPage <= 1}
                                            class="px-2 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                                        >
                                            Previous
                                        </button>
                                        
                                        <div class="text-xs text-slate-600">
                                            Page {ignoredCurrentPage} of {ignoredTotalPages}
                                        </div>
                                        
                                        <button
                                            onclick={() => { ignoredCurrentPage = Math.min(ignoredTotalPages, ignoredCurrentPage + 1); loadIgnoredRecords(); }}
                                            disabled={ignoredCurrentPage >= ignoredTotalPages}
                                            class="px-2 py-1 text-xs border border-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <div class="flex items-center justify-between">
                <div class="text-xs text-slate-600">
                    {issue ? getFieldValidationRules(issue.type) : ''}
                </div>
                <div class="flex items-center gap-2">
                    <button
                        onclick={() => onClose()}
                        class="px-3 py-1 text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 rounded font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onclick={() => onCorrectionComplete()}
                        disabled={!areAllIssuesResolved()}
                        class="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={areAllIssuesResolved() ? 'All issues have been resolved' : `There are still ${totalCount} unresolved issues. Please correct or ignore all issues before marking as corrected.`}
                    >
                        Mark as Corrected
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
{/if}