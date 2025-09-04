<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Upload } from '@lucide/svelte';

	let isLoading = false;
	let errorMessage = '';
	let successMessages: string[] = [];

	const handleFileChange = async (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		isLoading = true;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('zip_file', file);

			// Step 1: Upload and analyze file
			const uploadResponse = await fetch('http://localhost:8000/api/inventory/upload-sql-zip/', {
				method: 'POST',
				body: formData
			});

			const uploadData = await uploadResponse.json();

			if (!uploadResponse.ok) {
				throw new Error(uploadData.error || 'Upload failed');
			}

			// Step 2: Handle schema confirmation
			let schemaName = uploadData.schema_name;
			let confirmReplace = false;

			if (uploadData.has_schema_creation) {
				if (uploadData.schema_exists) {
					const userConfirm = confirm(`Schema "${schemaName}" already exists. Replace it?`);
					if (!userConfirm) {
						throw new Error('Import cancelled by user');
					}
					confirmReplace = true;
				}
			} else {
				schemaName = prompt('Enter schema name:');
				if (!schemaName) {
					throw new Error('Schema name is required');
				}

				// Check if schema exists
				const schemaCheck = await fetch('http://localhost:8000/api/inventory/confirm-import/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						import_id: uploadData.import_id,
						schema_name: schemaName,
						confirm_replace: 'false'
					})
				});

				const checkData = await schemaCheck.json();

				if (checkData.schema_exists) {
					const userConfirm = confirm(`Schema "${schemaName}" already exists. Replace it?`);
					if (!userConfirm) {
						throw new Error('Import cancelled by user');
					}
					confirmReplace = true;
				}
			}

			// Step 3: Execute import
			const importResponse = await fetch('http://localhost:8000/api/inventory/confirm-import/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					import_id: uploadData.import_id,
					schema_name: schemaName,
					confirm_replace: confirmReplace.toString()
				})
			});

			const importData = await importResponse.json();

			if (!importResponse.ok) {
				throw new Error(importData.error || 'Import failed');
			}

			successMessages = [...successMessages, `Import completed successfully! File: <strong>${file.name}</strong>, Schema: <strong>${importData.schema_name}</strong>`];
			console.log('Import result:', importData);
		} catch (error) {
			console.error('Import error:', error);
			if (error instanceof Error) {
				errorMessage = error.message;
			} else {
				errorMessage = 'An unknown error occurred.';
			}
			alert(`Error: ${errorMessage}`);
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="space-y-4"></div>

<!-- File Upload Section -->
<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
	<div class="flex items-center gap-3 mb-4">
        <Upload class="text-emerald-600" size={20} />
        <h2 class="text-lg font-semibold text-slate-900">Foris Data Import</h2>
    </div>

	<div class="space-y-4">
		<!-- Drop Zone -->
		<div
			class="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center
                transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
		>
			<Upload class="mx-auto mb-4 text-slate-400" size={48} />
			<h3 class="mb-2 text-lg font-semibold text-slate-900">Upload Foris Data</h3>
			<!-- <p class="text-slate-600 mb-4">Drag and drop your ZIP files here, or click to browse</p> -->

			<input
                id="fileInput"
                type="file"
                name="zip_file"
				accept=".zip"
				class="hidden"
				onchange={handleFileChange}				 
                disabled={isLoading}
			/>

			<label
				for="fileInput"
				class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
			>
				<Upload size={16} />
				Choose zip file
			</label>

			<p class="mt-2 text-xs text-slate-500">Supports ZIP file for SQL</p>
		</div>
		<!-- <div>
            <label for="fileInput" class="block text-sm font-medium text-gray-700">Upload SQL ZIP File</label>
            <input
                id="fileInput"
                type="file"
                name="zip_file"
                class="mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-violet-50 file:text-violet-700
                       hover:file:bg-violet-100"
                on:change={handleFileChange}
                accept=".zip"
                disabled={isLoading}
            />
        </div> -->

		{#if isLoading}
			<div class="text-center text-blue-500">
				<p class="animate-pulse">Processing file...</p>
			</div>
		{/if}

		{#if successMessages.length > 0}
			{#each successMessages as message, index}
				<div
					class="relative rounded border border-green-400 bg-green-100 px-4 py-3 text-green-700"
					role="alert"
				>
					<strong class="font-bold">Success:</strong>
					<span class="block sm:inline">{@html message}</span>
				</div>
			{/each}
		{/if}

		{#if errorMessage}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline">{errorMessage}</span>
			</div>
		{/if}
	</div>
</div>
