<script lang="ts">
	import { onMount } from 'svelte';
	import { Database, Trash2, Plus, GitMerge, RefreshCw, Loader2, AlertCircle, CheckCircle, Info, Search, Filter, ExternalLink, Home, Upload, Settings } from '@lucide/svelte';
	import { API_ENDPOINTS } from '$lib/config/api';

	// Schema state
	let schemas: any[] = [];
	let isLoadingSchemas = false;
	let errorMessage = '';
	let successMessage = '';
	let searchTerm = '';
	let selectedSchemaType = 'all';
	let isDeletingSchema = '';
	let showDeleteConfirm = false;
	let schemaToDelete = '';

	// Computed properties for filtering
	$: filteredSchemas = schemas.filter(schema => {
		const matchesSearch = schema.schema_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			schema.tables?.some((table: string) => table.toLowerCase().includes(searchTerm.toLowerCase()));
		
		const matchesType = selectedSchemaType === 'all' || schema.schema_type === selectedSchemaType;
		
		return matchesSearch && matchesType;
	});

	$: importedCount = schemas.filter(s => s.schema_type === 'imported').length;
	$: mergedCount = schemas.filter(s => s.schema_type === 'merged').length;
	$: totalCount = schemas.length;

	// Load available schemas
	const loadSchemas = async () => {
		isLoadingSchemas = true;
		errorMessage = '';
		try {
			const response = await fetch(API_ENDPOINTS.INVENTORY_LIST_SCHEMAS());
			
			// Check if response is OK before parsing
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
			}
			
			// Check content-type to ensure it's JSON
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				const text = await response.text();
				throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 100)}`);
			}
			
			const data = await response.json();
			
			if (data.success) {
				schemas = data.schemas;
				console.log('Loaded schemas:', schemas);
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

	// Delete schema
	const deleteSchema = async (schemaName: string) => {
		schemaToDelete = schemaName;
		showDeleteConfirm = true;
	};

	// Confirm schema deletion
	const confirmDeleteSchema = async () => {
		if (!schemaToDelete) return;
		
		isDeletingSchema = schemaToDelete;
		showDeleteConfirm = false;
		
		try {
			const formData = new FormData();
			formData.append('schema_name', schemaToDelete);
			
			const response = await fetch(API_ENDPOINTS.INVENTORY_DELETE_SCHEMA, {
				method: 'POST',
				body: formData
			});
			
			const data = await response.json();
			
			if (data.success) {
				successMessage = `Schema "${schemaToDelete}" deleted successfully`;
				// Remove from local state
				schemas = schemas.filter(s => s.schema_name !== schemaToDelete);
				// Clear success message after 3 seconds
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else {
				throw new Error(data.error || 'Failed to delete schema');
			}
		} catch (error) {
			console.error('Error deleting schema:', error);
			errorMessage = error instanceof Error ? error.message : 'Failed to delete schema';
		} finally {
			isDeletingSchema = '';
			schemaToDelete = '';
		}
	};

	// Cancel schema deletion
	const cancelDeleteSchema = () => {
		showDeleteConfirm = false;
		schemaToDelete = '';
	};

	// Format file size
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	// Load schemas on page load
	onMount(() => {
		loadSchemas();
	});
</script>

<div class="min-h-screen bg-slate-50">
	<div class="max-w-7xl mx-auto p-6 space-y-6">
		<!-- Header -->
		<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
						<Database class="text-blue-600" size={24} />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-slate-900">Schema Dashboard</h1>
						<p class="text-slate-600">Manage your imported and merged database schemas</p>
					</div>
				</div>
				<div class="flex gap-3">
					<button
						onclick={loadSchemas}
						disabled={isLoadingSchemas}
						class="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-slate-700 font-medium transition-colors hover:bg-slate-100 disabled:opacity-50"
					>
						<RefreshCw class={isLoadingSchemas ? 'animate-spin' : ''} size={16} />
						Refresh
					</button>
				</div>
			</div>
		</div>

		<!-- Navigation Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Import Schema Card -->
			<a href="/inventory/import" class="group">
				<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group-hover:border-blue-300">
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
							<Upload class="text-emerald-600" size={20} />
						</div>
						<div class="flex-1">
							<h3 class="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">Import Schema</h3>
							<p class="text-sm text-slate-600">Upload SQL zip files</p>
						</div>
						<ExternalLink class="text-slate-400 group-hover:text-emerald-600 transition-colors" size={16} />
					</div>
				</div>
			</a>

			<!-- Merge Schemas Card -->
			<a href="/inventory/merge" class="group">
				<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group-hover:border-purple-300">
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
							<GitMerge class="text-purple-600" size={20} />
						</div>
						<div class="flex-1">
							<h3 class="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">Merge Schemas</h3>
							<p class="text-sm text-slate-600">Combine multiple schemas into one</p>
						</div>
						<ExternalLink class="text-slate-400 group-hover:text-purple-600 transition-colors" size={16} />
					</div>
				</div>
			</a>

			<!-- Settings Card -->
			<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<div class="flex items-center gap-4">
					<div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
						<Settings class="text-slate-600" size={20} />
					</div>
					<div class="flex-1">
						<h3 class="font-semibold text-slate-900">Schema Stats</h3>
						<p class="text-sm text-slate-600">{totalCount} total schemas</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-slate-600">Total Schemas</p>
						<p class="text-2xl font-bold text-slate-900">{totalCount}</p>
					</div>
					<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
						<Database class="text-blue-600" size={20} />
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-slate-600">Imported Schemas</p>
						<p class="text-2xl font-bold text-blue-600">{importedCount}</p>
					</div>
					<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
						<Upload class="text-blue-600" size={20} />
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-slate-600">Merged Schemas</p>
						<p class="text-2xl font-bold text-purple-600">{mergedCount}</p>
					</div>
					<div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
						<GitMerge class="text-purple-600" size={20} />
					</div>
				</div>
			</div>
		</div>

		<!-- Messages Section -->
		{#if successMessage || errorMessage}
			<div class="space-y-3">
				{#if successMessage}
					<div class="relative rounded-xl border border-green-400 bg-green-50 px-6 py-4 text-green-700" role="alert">
						<div class="flex items-start gap-3">
							<CheckCircle class="text-green-600 mt-0.5" size={20} />
							<div>
								<strong class="font-semibold">Success!</strong>
								<span class="block sm:inline ml-1">{successMessage}</span>
							</div>
						</div>
					</div>
				{/if}

				{#if errorMessage}
					<div class="relative rounded-xl border border-red-400 bg-red-50 px-6 py-4 text-red-700" role="alert">
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

		<!-- Schema List -->
		<div class="bg-white rounded-xl border border-slate-200 shadow-sm">
			<div class="p-6 border-b border-slate-200">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
						<Database size={20} />
						All Schemas ({filteredSchemas.length})
					</h2>
					<div class="flex gap-2">
						<!-- Search Bar -->
						<div class="relative">
							<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
							<input
								type="text"
								bind:value={searchTerm}
								placeholder="Search schemas..."
								class="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
							/>
						</div>

						<!-- Filter Dropdown -->
						<select
							bind:value={selectedSchemaType}
							class="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						>
							<option value="all">All Types</option>
							<option value="imported">Imported</option>
							<option value="merged">Merged</option>
						</select>
					</div>
				</div>
			</div>

			<div class="p-6">
				{#if isLoadingSchemas}
					<div class="flex items-center justify-center py-12">
						<Loader2 class="animate-spin text-blue-600" size={32} />
						<span class="ml-3 text-slate-600">Loading schemas...</span>
					</div>
				{:else if filteredSchemas.length === 0}
					<div class="text-center py-12 text-slate-500">
						<Database class="mx-auto mb-4 text-slate-300" size={48} />
						<p class="text-lg font-medium mb-2">
							{searchTerm || selectedSchemaType !== 'all' ? 'No schemas found matching your criteria' : 'No schemas found'}
						</p>
						<p class="text-sm mb-4">
							{searchTerm || selectedSchemaType !== 'all' ? 'Try adjusting your search terms or filters' : 'Import or merge some schemas first to get started'}
						</p>
						<a href="/inventory/import" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors">
							<Plus size={16} />
							Import Your First Schema
						</a>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each filteredSchemas as schema}
							<div class="bg-slate-50 rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
								<div class="flex items-start justify-between mb-3">
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-slate-900 truncate" title={schema.schema_name}>
											{schema.schema_name}
										</h3>
									</div>
									<button
										onclick={() => deleteSchema(schema.schema_name)}
										disabled={isDeletingSchema === schema.schema_name}
										class="ml-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
										title="Delete schema"
									>
										{#if isDeletingSchema === schema.schema_name}
											<Loader2 class="animate-spin" size={16} />
										{:else}
											<Trash2 size={16} />
										{/if}
									</button>
								</div>

								<div class="space-y-2">
									<!-- Schema Type Badge -->
									<div class="flex items-center gap-2">
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {schema.schema_type === 'merged' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
											{schema.schema_type === 'merged' ? 'Merged' : 'Imported'}
										</span>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
											{schema.table_count} {schema.table_count === 1 ? 'table' : 'tables'}
										</span>
									</div>

									<!-- Size Information -->
									{#if schema.total_size_mb > 0}
										<p class="text-xs text-slate-600">
											Size: {formatFileSize(schema.total_size_bytes)}
										</p>
									{/if}

									<!-- Additional Info -->
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
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
			<div class="flex items-center gap-3 mb-4">
				<div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
					<AlertCircle class="text-red-600" size={20} />
				</div>
				<div>
					<h3 class="text-lg font-semibold text-slate-900">Delete Schema</h3>
					<p class="text-sm text-slate-600">This action cannot be undone</p>
				</div>
			</div>
			
			<p class="text-slate-700 mb-6">
				Are you sure you want to delete the schema <strong>"{schemaToDelete}"</strong>? 
				This will permanently remove the schema and all its data from the database.
			</p>
			
			<div class="flex gap-3">
				<button
					onclick={cancelDeleteSchema}
					class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={confirmDeleteSchema}
					class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
				>
					Delete Schema
				</button>
			</div>
		</div>
	</div>
{/if}
