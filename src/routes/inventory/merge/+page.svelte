<script lang="ts">
	import { onMount } from 'svelte';
	import { GitMerge, Database, CheckCircle, AlertCircle, Loader2, RefreshCw, ArrowRight, Info, Settings, Target, Users, Layers, Search, Filter } from '@lucide/svelte';
	import { API_ENDPOINTS } from '$lib/config/api';

	// Schema merge state
	let schemas: any[] = $state([]);
	let selectedSchemas: string[] = $state([]);
	let targetSchemaName = $state('');
	let createNewSchema = $state(true);
	let mergeStrategy = $state('union');
	let isLoadingSchemas = $state(false);
	let isMerging = $state(false);
	let mergeProgress = $state('');
	let mergeStep = $state('');
	let errorMessage = $state('');
	let successMessages: string[] = $state([]);
	let searchTerm = $state('');
	let showAdvancedOptions = $state(false);

	// Computed properties for better UX
	let filteredSchemas = $derived(schemas.filter(schema => 
		schema.schema_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(schema.tables && schema.tables.some((table: string) => table.toLowerCase().includes(searchTerm.toLowerCase())))
	));
	
	// Debug reactive statements
	$effect(() => {
		console.log('Schemas updated:', schemas.length, 'Filtered:', filteredSchemas.length);
	});

	let canMerge = $derived(selectedSchemas.length >= 1 && targetSchemaName.trim() && !isMerging);

	// Load available schemas
	const loadSchemas = async () => {
		isLoadingSchemas = true;
		errorMessage = '';
		try {
			const response = await fetch(`${API_ENDPOINTS.INVENTORY_LIST_SCHEMAS}?detailed=true&include_empty=false&imported_only=true`);
			const data = await response.json();
			
			if (data.success) {
				schemas = [...data.schemas]; // Force reactivity by creating a new array
				console.log('Loaded imported schemas:', schemas);
			} else {
				throw new Error(data.error || 'Failed to load schemas');
			}
		} catch (error) {
			console.error('Error loading schemas:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to load schemas';
		} finally {
			isLoadingSchemas = false;
		}
	};

	// Toggle schema selection
	const toggleSchemaSelection = (schemaName: string) => {
		console.log('Toggling schema:', schemaName, 'Current selected:', selectedSchemas);
		if (selectedSchemas.includes(schemaName)) {
			selectedSchemas = selectedSchemas.filter(name => name !== schemaName);
		} else {
			selectedSchemas = [...selectedSchemas, schemaName];
		}
		console.log('After toggle:', selectedSchemas);
	};

	// Select all schemas
	const selectAllSchemas = () => {
		selectedSchemas = filteredSchemas.map(schema => schema.schema_name);
	};

	// Clear all selections
	const clearAllSelections = () => {
		selectedSchemas = [];
	};

	// Handle schema creation mode change
	const handleCreateNewSchemaChange = () => {
		targetSchemaName = ''; // Clear target schema when switching modes
	};

	// Merge schemas using optimized API with detailed progress tracking
	const mergeSchemas = async () => {
		if (selectedSchemas.length < 1) {
			errorMessage = 'Please select at least 1 schema to merge';
			return;
		}

		if (!targetSchemaName.trim()) {
			errorMessage = createNewSchema ? 'Please enter a target schema name' : 'Please select an existing schema as target';
			return;
		}

		// If creating new schema, we need at least 2 schemas
		if (createNewSchema && selectedSchemas.length < 2) {
			errorMessage = 'Please select at least 2 schemas when creating a new target schema';
			return;
		}

		// Check if target schema is also selected as source (when not creating new)
		if (!createNewSchema && selectedSchemas.includes(targetSchemaName)) {
			errorMessage = 'Target schema cannot be the same as one of the source schemas';
			return;
		}

		isMerging = true;
		errorMessage = '';
		mergeProgress = 'Initializing optimized merge process...';
		mergeStep = 'Step 1/4: Preparing merge configuration';

		try {
			const formData = new FormData();
			// Use array format for source_schemas to match the optimized API
			selectedSchemas.forEach(schema => {
				formData.append('source_schemas[]', schema);
			});
			formData.append('target_schema', targetSchemaName.trim());
			formData.append('create_new_schema', createNewSchema.toString());
			formData.append('merge_strategy', mergeStrategy);

			mergeProgress = 'Analyzing table structures and caching column information...';
			mergeStep = 'Step 2/4: Analyzing schemas';

			const response = await fetch(API_ENDPOINTS.INVENTORY_MERGE_SCHEMAS, {
				method: 'POST',
				body: formData
			});

			mergeProgress = 'Processing merge request...';
			mergeStep = 'Step 3/4: Executing merge';

			const data = await response.json();

			mergeProgress = 'Finalizing merge and updating tracking records...';
			mergeStep = 'Step 4/4: Finalizing';

			if (data.success) {
				const sourceSchemasList = Array.isArray(data.source_schemas) ? data.source_schemas : selectedSchemas;
				const finalTargetSchema = data.target_schema || targetSchemaName.trim();
				const actionText = selectedSchemas.length === 1 ? 'Schema merged' : 'Schemas merged';
				successMessages = [...successMessages, `${actionText} successfully using optimized method! Target: <strong>${finalTargetSchema}</strong>, Merged: <strong>${sourceSchemasList.join(', ')}</strong>`];
				
				// Show additional details if available
				if (data.details) {
					const details = data.details;
					const additionalInfo = [];
					if (details.created_tables) {
						additionalInfo.push(`${details.created_tables.length} tables created`);
					}
					if (details.created_indexes) {
						additionalInfo.push(`${details.created_indexes.length} indexes created`);
					}
					if (details.optimization) {
						additionalInfo.push(`Optimization: ${details.optimization}`);
					}
					if (additionalInfo.length > 0) {
						successMessages = [...successMessages, `Details: ${additionalInfo.join(', ')}`];
					}
				}
				
				// Reset form
				selectedSchemas = [];
				targetSchemaName = '';
				searchTerm = '';
				// Reload schemas to show the new merged schema
				await loadSchemas();
			} else {
				throw new Error(data.error || 'Merge failed');
			}
		} catch (error) {
			console.error('Merge error:', error);
			errorMessage = error instanceof Error ? error.message : 'An error occurred during merge';
		} finally {
			isMerging = false;
			mergeProgress = '';
			mergeStep = '';
		}
	};

	// Get strategy description
	const getStrategyDescription = (strategy: string) => {
		switch (strategy) {
			case 'union':
				return 'Combines all data from all schemas, excluding duplicates';
			case 'priority':
				return 'Uses data from the first schema, falls back to others for missing data';
			case 'intersection':
				return 'Only includes data that exists in all selected schemas';
			default:
				return '';
		}
	};

	// Load schemas on page load
	onMount(() => {
		loadSchemas();
	});
</script>

<div class="min-h-screen bg-slate-50 relative">
	<!-- Blocking overlay during merge -->
	{#if isMerging}
		<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
			<div class="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
				<div class="text-center">
					<Loader2 class="animate-spin text-emerald-600 mx-auto mb-4" size={48} />
					<h3 class="text-lg font-semibold text-slate-900 mb-2">Optimized Schema Merge in Progress</h3>
					<p class="text-sm text-slate-600 mb-4">{mergeStep}</p>
					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<p class="text-sm text-blue-700 font-medium mb-2">Current Operation:</p>
						<p class="text-xs text-blue-600">{mergeProgress}</p>
					</div>
					<div class="mt-4 text-xs text-slate-500">
						Please wait while the merge completes. Do not close this page or refresh.
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<div class="max-w-7xl mx-auto p-6 space-y-6 {isMerging ? 'pointer-events-none' : ''}">
		<!-- Header -->
		<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
						<GitMerge class="text-emerald-600" size={24} />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-slate-900">Schema Merge</h1>
						<p class="text-slate-600">Combine schemas into a target schema - merge multiple schemas or merge one schema into an existing schema</p>
					</div>
				</div>
				<button
					onclick={loadSchemas}
					disabled={isLoadingSchemas || isMerging}
					class="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-emerald-700 font-medium transition-colors hover:bg-emerald-100 disabled:opacity-50"
				>
					<RefreshCw class={isLoadingSchemas ? 'animate-spin' : ''} size={16} />
					Refresh Schemas
				</button>
			</div>
		</div>

		<!-- Messages Section -->
		{#if successMessages.length > 0 || errorMessage}
			<div class="space-y-3">
				{#if successMessages.length > 0}
					{#each successMessages as message, index}
						<div
							class="relative rounded-xl border border-green-400 bg-green-50 px-6 py-4 text-green-700"
							role="alert"
						>
							<div class="flex items-start gap-3">
								<CheckCircle class="text-green-600 mt-0.5" size={20} />
								<div>
									<strong class="font-semibold">Success!</strong>
									<span class="block sm:inline ml-1">{@html message}</span>
								</div>
							</div>
						</div>
					{/each}
				{/if}

				{#if errorMessage}
					<div
						class="relative rounded-xl border border-red-400 bg-red-50 px-6 py-4 text-red-700"
						role="alert"
					>
						<div class="flex items-start gap-3">
							<AlertCircle class="text-red-600 mt-0.5" size={20} />
							<div>
								<strong class="font-semibold">Error:</strong>
								<span class="block sm:inline ml-1">{errorMessage}</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
			<!-- Schema List Panel -->
			<div class="space-y-6 col-span-4">
				<!-- Available Schemas -->
				<div class="bg-white rounded-xl border border-slate-200 shadow-sm">
					<div class="p-6 border-b border-slate-200">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
								<Database size={20} />
								Available Schemas ({filteredSchemas.length})
							</h2>
							<div class="flex gap-2">
								<!-- <button
									onclick={selectAllSchemas}
									class="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
								>
									Select All
								</button> -->
								<button
									onclick={clearAllSelections}
									disabled={isMerging}
									class="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Clear All
								</button>
							</div>
						</div>
					</div>

					<!-- Search Bar -->
					<div class="p-4 border-b border-slate-200">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
							<input
								type="text"
								bind:value={searchTerm}
								placeholder="Search schemas or tables..."
								disabled={isMerging}
								class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							/>
						</div>
					</div>
					
					<div class="p-4">
						{#if isLoadingSchemas}
							<div class="flex items-center justify-center py-12">
								<Loader2 class="animate-spin text-emerald-600" size={32} />
								<span class="ml-3 text-slate-600">Loading schemas...</span>
							</div>
						{:else if filteredSchemas.length === 0}
							<div class="text-center py-12 text-slate-500">
								<Database class="mx-auto mb-4 text-slate-300" size={48} />
								<p class="text-lg font-medium mb-2">
									{searchTerm ? 'No schemas found matching your search' : 'No schemas found'}
								</p>
								<p class="text-sm">
									{searchTerm ? 'Try adjusting your search terms' : 'Import or merge some schemas first to get started'}
								</p>
							</div>
						{:else}
							<div class="space-y-3 max-h-96 overflow-y-auto p-2">
								{#each filteredSchemas as schema}
									<button
										class="relative w-full p-4 rounded-lg border-2 transition-all {!isMerging ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-50'} {selectedSchemas.includes(schema.schema_name) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}"
										onclick={() => !isMerging && toggleSchemaSelection(schema.schema_name)}
										disabled={isMerging}
									>
										<div class="flex items-start gap-3">
											<div class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 {selectedSchemas.includes(schema.schema_name) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}">
												{#if selectedSchemas.includes(schema.schema_name)}
													<CheckCircle class="text-white" size={12} />
												{/if}
											</div>
																							<div class="min-w-0 flex-1">
													<div class="mb-1 text-left">
														<p class="font-semibold text-slate-900 truncate text-left" title={schema.schema_name}>{schema.schema_name}</p>
													</div>
												<div class="flex items-center gap-2 mb-1">
													<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
														{schema.table_count} {schema.table_count === 1 ? 'table' : 'tables'}
													</span>
													<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {schema.schema_type === 'merged' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
														{schema.schema_type === 'merged' ? 'Merged' : 'Imported'}
													</span>
												</div>
												{#if schema.schema_type === 'merged' && schema.source_schemas}
													<p class="text-xs text-slate-500 truncate" title={schema.source_schemas.join(', ')}>
														From: {schema.source_schemas.slice(0, 2).join(', ')}{schema.source_schemas.length > 2 ? '...' : ''} ({schema.merge_strategy})
													</p>
												{:else if schema.tables && schema.tables.length > 0}
													<p class="text-xs text-slate-500 truncate" title={schema.tables.join(', ')}>
														Tables: {schema.tables.slice(0, 3).join(', ')}{schema.tables.length > 3 ? '...' : ''}
													</p>
												{/if}
											</div>
											{#if selectedSchemas.includes(schema.schema_name)}
												<div class="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Selected Schemas Panel -->
			<div class="space-y-6 col-span-3">
				<!-- Information Panel -->
				<div class="bg-blue-50 rounded-xl border border-blue-200 p-6">
					<div class="flex items-start gap-3">
						<Info class="text-blue-600 mt-0.5" size={20} />
						<div>
							<h3 class="text-sm font-semibold text-blue-900 mb-2">How Schema Merging Works</h3>
							<ul class="text-xs text-blue-700 space-y-1">
								<li>• Select 1 or more schemas (imported or merged) to merge</li>
								<li>• Choose your merge strategy carefully</li>
								<li>• Target schema will contain combined data</li>
								<li>• Original schemas remain unchanged</li>
								<li>• Merged schemas are tracked and can be used again</li>
								<li>• For new schemas: select 2+ schemas. For existing: 1+ schema</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Selected Schemas Summary -->
				<div class="bg-emerald-50 rounded-xl border border-emerald-200 p-6 min-h-[120px]">
					<h3 class="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
						<Users size={20} />
						Selected Schemas ({selectedSchemas.length})
					</h3>
					{#if selectedSchemas.length > 0}
						<div class="space-y-2">
							{#each selectedSchemas as schema}
								<div class="flex items-center justify-between p-3 bg-emerald-100 rounded-lg">
									<span class="text-sm font-medium text-emerald-700 truncate">{schema}</span>
									<button
										onclick={() => toggleSchemaSelection(schema)}
										disabled={isMerging}
										class="ml-2 p-1 hover:bg-emerald-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<div class="flex items-center justify-center h-16 text-emerald-600">
							<p class="text-sm font-medium">No schemas selected yet</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Merge Configuration Panel -->
			<div class="space-y-6 col-span-3">
				<!-- Merge Configuration -->
				<div class="bg-white rounded-xl border border-slate-200 shadow-sm">
					<div class="p-6 border-b border-slate-200">
						<h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
							<Settings size={20} />
							Merge Configuration
						</h2>
					</div>

					<div class="p-6 space-y-6">
						<!-- Target Schema -->
						<div>
							<label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
								<Target size={16} />
								Target Schema
							</label>
							{#if createNewSchema}
								<input
									type="text"
									bind:value={targetSchemaName}
									placeholder="Enter target schema name"
									disabled={isMerging}
									class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								/>
							{:else}
								<select
									bind:value={targetSchemaName}
									disabled={isMerging}
									class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<option value="">Select existing schema</option>
									{#each schemas as schema}
										<option value={schema.schema_name}>{schema.schema_name} ({schema.table_count} tables)</option>
									{/each}
								</select>
							{/if}
						</div>

						<!-- Create New Schema Option -->
						<div class="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
							<input
								type="checkbox"
								id="createNewSchema"
								bind:checked={createNewSchema}
								onchange={handleCreateNewSchemaChange}
								disabled={isMerging}
								class="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<label for="createNewSchema" class="text-sm text-slate-700 font-medium">
								Create new schema
							</label>
						</div>

						<!-- Merge Strategy -->
						<div>
							<label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
								<Layers size={16} />
								Merge Strategy
							</label>
							<select
								bind:value={mergeStrategy}
								disabled={isMerging}
								class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<option value="union">Union (Combine all data)</option>
								<option value="priority">Priority (First schema precedence)</option>
								<option value="intersection">Intersection (Common data only)</option>
							</select>
							<p class="text-xs text-slate-500 mt-2">{getStrategyDescription(mergeStrategy)}</p>
						</div>

						<!-- Advanced Options Toggle -->
						<button
							onclick={() => showAdvancedOptions = !showAdvancedOptions}
							disabled={isMerging}
							class="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span class="text-sm font-medium text-slate-700">Advanced Options</span>
							<ArrowRight class="text-slate-500 transition-transform {showAdvancedOptions ? 'rotate-90' : ''}" size={16} />
						</button>

						{#if showAdvancedOptions}
							<div class="space-y-4 p-4 bg-slate-50 rounded-lg">
								<div>
									<label class="block text-sm font-medium text-slate-700 mb-2">Advanced Configuration</label>
									<p class="text-xs text-slate-500">Additional merge options will be available here in future updates.</p>
								</div>
							</div>
						{/if}

						<!-- Merge Button -->
						<button
							onclick={mergeSchemas}
							disabled={!canMerge}
							class="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-emerald-600 px-6 py-4 text-white font-semibold transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
						>
							{#if isMerging}
								<Loader2 class="animate-spin" size={20} />
								Merging...
							{:else}
								<GitMerge size={20} />
								{selectedSchemas.length === 1 ? 'Merge Schema' : 'Merge Schemas'}
							{/if}
						</button>

						<!-- Progress Indicator -->
						{#if mergeProgress && !isMerging}
							<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
								<div class="flex items-center gap-2 mb-2">
									<Loader2 class="animate-spin text-blue-600" size={16} />
									<span class="text-sm font-medium text-blue-700">Optimized Merge in Progress...</span>
								</div>
								<p class="text-sm text-blue-600">{mergeProgress}</p>
								<div class="mt-2 text-xs text-blue-500">
									Using optimized merge with column caching and single connection for better performance
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		
	</div>
</div>
