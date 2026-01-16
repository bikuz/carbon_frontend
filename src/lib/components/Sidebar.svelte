<script>
    import { TreePine, FolderOpen, Database, Wrench, Settings, HelpCircle,
      TreeDeciduous,Trees
     } from '@lucide/svelte';
    import { page } from '$app/stores';
    
    let activeItem = $state('schemas');
    
    const navigationItems = [
      // { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/projects' },
      { id: 'schemas', label: 'Import Foris Data', icon: Database, href: '/inventory' },
      {id:'mrv',label:'Forest Analysis',icon:Trees, href:'/mrv'},
      // { id: 'tools', label: 'Tools', icon: Wrench, href: '/tools' },
    ];
    
    const bottomItems = [
      // { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
      // { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
    ];
  </script>
  
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
          <TreePine class="text-white" size={20} />
        </div>
        <div>
          <h1 class="font-bold text-slate-900">ForestBio</h1>
          <p class="text-xs text-slate-500">Analysis Platform</p>
        </div>
      </div>
    </div>
  
    <!-- Navigation -->
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        {#each navigationItems as item}
          <li>
            <a
              href={item.href}
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                     {$page.url.pathname === item.href 
                       ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                       : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
            >
              {#if item.icon}
                <item.icon size={18} />
              {/if}
              <span class="font-medium">{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  
    <!-- Bottom Navigation -->
    <div class="p-4 border-t border-slate-200">
      <ul class="space-y-2">
        {#each bottomItems as item}
          <li>
            <a
              href={item.href}
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              {#if item.icon}
                <item.icon size={18} />
              {/if}
              <span class="font-medium">{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </aside>
  