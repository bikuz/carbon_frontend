// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// API endpoints
export const API_ENDPOINTS = {
    // MRV endpoints
    MRV_PROJECTS: `${API_BASE_URL}/mrv/projects/`,
    MRV_CREATE_PROJECT: `${API_BASE_URL}/mrv/projects/create/`,
    MRV_PROJECT_DETAIL: (id: number) => `${API_BASE_URL}/mrv/projects/${id}/`,
    MRV_UPDATE_PROJECT: (id: number) => `${API_BASE_URL}/mrv/projects/${id}/update/`,
    MRV_DELETE_PROJECT: (id: number) => `${API_BASE_URL}/mrv/projects/${id}/delete/`,
    
    // MRV Data Import endpoints
    MRV_PROJECT_DATA_IMPORTS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-imports/`,
    MRV_PROJECT_DATA_IMPORT_PREVIEW: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-imports/preview/`,
    MRV_PROJECT_DATA_IMPORT_CREATE: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-imports/create/`,
    MRV_PROJECT_DATA_IMPORT_DETAIL: (projectId: number, importId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-imports/${importId}/`,
    MRV_PROJECT_DATA_IMPORT_DELETE: (projectId: number, importId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-imports/${importId}/delete/`,
    
    // MRV Data Quality Check endpoints
    MRV_PROJECT_DATA_QUALITY_CHECK: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/`,
    MRV_PROJECT_DATA_QUALITY_ISSUE_DETAILS: (projectId: number, issueType: string) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/${issueType}/details/`,
    MRV_PROJECT_DATA_QUALITY_UPDATE_RECORD: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/update-record/`,
    MRV_PROJECT_DATA_QUALITY_BULK_UPDATE: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/bulk-update/`,
    MRV_PROJECT_DATA_QUALITY_IGNORE_RECORDS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/ignore-records/`,
    MRV_PROJECT_DATA_QUALITY_UNIGNORE_RECORDS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/unignore-records/`,
    MRV_PROJECT_DATA_QUALITY_IGNORED_RECORDS: (projectId: number, issueType: string) => `${API_BASE_URL}/mrv/projects/${projectId}/data-quality-check/${issueType}/ignored-records/`,
    MRV_PROJECT_PHYSIOGRAPHY_OPTIONS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/physiography-options/`,
    MRV_PHYSIOGRAPHY_LIST: `${API_BASE_URL}/mrv/physiography/`,
    MRV_FOREST_SPECIES_LIST: `${API_BASE_URL}/mrv/forest-species/`,
    
    // MRV Data Cleaning endpoints
    MRV_PROJECT_DATA_CLEANING_SUMMARY: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-cleaning/summary/`,
    MRV_PROJECT_DATA_CLEANING_REMOVE_IGNORED: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-cleaning/remove-ignored/`,
    MRV_PROJECT_DATA_CLEANING_VIEW_RECORDS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/data-cleaning/view-records/`,
    
    // MRV HD Model endpoints
    MRV_PROJECT_HD_MODEL_PHYSIOGRAPHY_SUMMARY: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/hd-model/physiography-summary/`,
    MRV_PROJECT_HD_MODEL_ASSIGN_MODELS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/hd-model/assign-models/`,
    MRV_PROJECT_HD_MODEL_UNASSIGNED_RECORDS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/hd-model/unassigned-records/`,
    MRV_PROJECT_HD_MODEL_UPDATE_SPECIES_MAPPING: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/hd-model/update-species-mapping/`,
    MRV_PROJECT_HEIGHT_PREDICTION: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/height-prediction/`,
    MRV_PROJECT_HEIGHT_PREDICTION_STATUS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/height-prediction/status/`,
    MRV_PROJECT_SLANTED_HEIGHT_CALCULATION: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/slanted-height-calculation/`,
    MRV_PROJECT_SLANTED_HEIGHT_CALCULATION_STATUS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/slanted-height-calculation/status/`,
    MRV_PROJECT_HD_RELATION_DATA: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/hd-relation/data/`,
    MRV_HD_MODEL_LIST: `${API_BASE_URL}/mrv/hd-model/`,
    
    // MRV Volume Ratio endpoints
    MRV_PROJECT_VOLUME_RATIO_CALCULATION: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/volume-ratio-calculation/`,
    MRV_PROJECT_VOLUME_RATIO_STATUS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/volume-ratio-calculation/status/`,
    
    // MRV Carbon Calculation endpoints
    MRV_ALLOMETRIC_MODELS: `${API_BASE_URL}/mrv/allometric-models/`,
    MRV_PROJECT_ALLOMETRIC_ASSIGNMENT_STATUS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/allometric-assignment-status/`,
    MRV_PROJECT_ALLOMETRIC_ASSIGNMENT: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/allometric-assignment/`,
    MRV_PROJECT_SAVE_ALLOMETRIC_ASSIGNMENTS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/save-allometric-assignments/`,
    MRV_PROJECT_BIOMASS_CALCULATION_STATUS: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/biomass-calculation-status/`,
    MRV_PROJECT_BIOMASS_CALCULATION: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/biomass-calculation/`,
    MRV_PROJECT_EXPORT_TREE_BIOMETRIC_CALC: (projectId: number) => `${API_BASE_URL}/mrv/projects/${projectId}/export-tree-biometric-calc/`,
    
    // Inventory endpoints
    INVENTORY_LIST_SCHEMAS: (detailed: boolean = true, includeEmpty: boolean = true, importedOnly: boolean = true) => {
        const params = new URLSearchParams();
        if (detailed) params.append('detailed', 'true');
        if (includeEmpty) params.append('include_empty', 'true');
        if (importedOnly) params.append('imported_only', 'true');
        return `${API_BASE_URL}/inventory/list-schemas/?${params.toString()}`;
    },
    INVENTORY_DELETE_SCHEMA: `${API_BASE_URL}/inventory/delete-schema/`,
    INVENTORY_UPLOAD_SQL_ZIP: `${API_BASE_URL}/inventory/upload-sql-zip/`,
    INVENTORY_CONFIRM_IMPORT: `${API_BASE_URL}/inventory/confirm-import/`,
    INVENTORY_MERGE_SCHEMAS: `${API_BASE_URL}/inventory/merge-multiple-schemas-optimized/`,
    
    // Add more endpoints as needed
    // HEIGHT_DIAMETER: `${API_BASE_URL}/mrv/height-diameter/`,
    // VOLUME_RATIO: `${API_BASE_URL}/mrv/volume-ratio/`,
    // CARBON_EMISSION: `${API_BASE_URL}/mrv/carbon-emission/`,
} as const;

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
    return `${API_BASE_URL}${endpoint}`;
}
