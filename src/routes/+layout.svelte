<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { TreePine } from '@lucide/svelte';
	let { children } = $props();
</script>

<svelte:head>
	
    <title>Forest Biometric Analysis - Dashboard</title>
    <meta name="description" content="Advanced forest data analysis platform" />

	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen bg-slate-50">
	<Sidebar />

	<main class="flex-1 overflow-auto">
		<div class="p-6 space-y-6">
		  <!-- Header -->
		  <div class="flex items-center justify-between">
			<div>
			  <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
				<TreePine class="text-emerald-600" size={32} />
				Forest Biometric Analysis System
			  </h1>
			  <p class="text-slate-600 mt-1">Advanced forest data analysis platform</p>
			</div>
		  </div>



		  {@render children?.()}

		</div>
	</main>
	
</div>



  