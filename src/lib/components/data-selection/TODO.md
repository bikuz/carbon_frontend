# Data Selection Components TODO

## Completed Tasks
- [x] Remove 4th step (Outlier Detection) from workflow
- [x] Enhance Step 4 (Data Cleaning) with comprehensive cleaning actions
- [x] Create DataCleaning.svelte component
- [x] Export DataCleaning component from index.ts
- [x] Replace inline Data Cleaning content with DataCleaning component
- [x] Update main page to import and use DataCleaning component

## Component Features Implemented
- [x] Data summary dashboard with 4 metrics
- [x] Remove ignored records functionality
- [x] View all records with pagination and filtering (15 columns)
- [x] Progress tracking for each cleaning action
- [x] Final validation checklist
- [x] Debug integration with debug.js utility
- [x] Real API integration for data cleaning operations
- [x] Dynamic physiography zone dropdown from public.physiography table
- [x] Searchable species dropdown from MRV_FOREST_SPECIES_LIST endpoint

## Next Steps for Backend Integration
- [x] Implement `/api/projects/{id}/data-cleaning/summary` endpoint
- [x] Implement `/api/projects/{id}/data-cleaning/remove-ignored` endpoint
- [x] Implement `/api/projects/{id}/data-cleaning/view-records` endpoint


## Component Structure
```
DataCleaning.svelte
├── Props: projectId, onCleaningComplete
├── State: dataSummary, cleaningProgress, messages
├── Functions: loadDataSummary, cleaning actions, progress tracking
└── UI: Summary dashboard, action buttons, progress indicators, validation checklist
```

## Benefits of Component Separation
- ✅ Reusable across different parts of the application
- ✅ Easier to maintain and test
- ✅ Cleaner main page code
- ✅ Better separation of concerns
- ✅ Easier to implement real API integration
- ✅ Consistent with other data selection components
