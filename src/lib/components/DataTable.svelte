<script lang="ts">
    import { ChevronDown, ChevronRight, Search, Filter } from '@lucide/svelte';
    
    let { title, data, columns } = $props<{
      title: string;
      data: any[];
      columns: { key: string; label: string }[];
    }>();
    let isExpanded = $state(true);
    let searchTerm = $state('');
    let filteredData = $derived(
      data.filter((row: any) => 
        Object.values(row).some((value: any) => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  </script>
  
  <div class="bg-white rounded-xl shadow-sm border border-slate-200">
    <!-- Header -->
    <div class="p-4 border-b border-slate-200">
      <div class="flex items-center justify-between">
        <button
          onclick={() => isExpanded = !isExpanded}
          class="flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
        >
          {#if isExpanded}
            <ChevronDown size={20} />
          {:else}
            <ChevronRight size={20} />
          {/if}
          {title}
          <span class="text-sm font-normal text-slate-500">({data.length} records)</span>
        </button>
        
        {#if isExpanded}
          <div class="flex items-center gap-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                bind:value={searchTerm}
                class="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button class="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Filter size={16} />
            </button>
          </div>
        {/if}
      </div>
    </div>
  
    <!-- Table Content -->
    {#if isExpanded}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              {#each columns as column}
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {column.label}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            {#each filteredData as row, index}
              <tr class="hover:bg-slate-50 transition-colors">
                {#each columns as column}
                  <td class="px-4 py-3 text-sm text-slate-900">
                    {row[column.key]}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if filteredData.length === 0}
          <div class="p-8 text-center text-slate-500">
            <p>No data found matching your search criteria.</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  