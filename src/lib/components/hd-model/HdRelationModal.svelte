<script lang="ts">
    import { BarChart3, X } from '@lucide/svelte';
    import { onMount, onDestroy } from 'svelte';
    import { API_ENDPOINTS } from '$lib/config/api';
    import { debug, debugAPI } from '$lib/utils/debug';
    import { generateSoothingColors } from '$lib/utils/color_generator';
    
    interface Props {
        showModal: boolean;
        currentProjectId: number;
        selectedPhyZone: number;
        selectedPhyZoneData: any;
        onclose: () => void;
    }
    
    let {
        showModal,
        currentProjectId,
        selectedPhyZone,
        selectedPhyZoneData,
        onclose
    }: Props = $props();
    
    // Modal state
    let chartData: any[] = $state([]);
    let isLoadingChartData = $state(false);
    let chartCanvas: HTMLCanvasElement;
    let chartInstance: any = null;
    let speciesVisibility: { [key: string]: boolean } = $state({});
    let allSpeciesVisible = $state(true);
    let speciesGroups: { [key: string]: { dbh: number[], height: number[], modelName: string, color: string, treeCount: number } } = $state({});
    let sortByTreeCount = $state(false);
    
    // Load chart data for all trees in the selected phy_zone
    async function loadChartData() {
        if (!currentProjectId || !selectedPhyZone) {
            debug('Cannot load chart data - missing project ID or phy_zone:', { currentProjectId, selectedPhyZone });
            return;
        }
        
        debug('Loading chart data for phy_zone:', selectedPhyZone);
        isLoadingChartData = true;
        try {
            const url = `${API_ENDPOINTS.MRV_PROJECT_HD_RELATION_DATA(currentProjectId)}?phy_zone=${selectedPhyZone}`;
            debugAPI('GET', url, null, 'request');
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                debugAPI('GET', url, data, 'response');
                
                if (data.success && data.chart_data) {
                    chartData = data.chart_data;
                    debug('Loaded chart data:', chartData);
                    debug('Chart data length:', chartData.length);
                } else {
                    debug('Failed to load chart data:', data.error);
                    chartData = [];
                }
            } else {
                debug('Failed to load chart data:', response.status);
                chartData = [];
            }
        } catch (error) {
            debug('Error loading chart data:', error);
            chartData = [];
        } finally {
            isLoadingChartData = false;
        }
    }
    
    
    // Render Chart.js chart
    async function renderChart() {
        if (!chartCanvas || !chartData.length) {
            debug('Cannot render chart - missing canvas or data:', { chartCanvas: !!chartCanvas, dataLength: chartData.length });
            return;
        }
        
        debug('Rendering chart with data:', chartData);
        
        // Destroy existing chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        
        // Import Chart.js dynamically
        const { Chart, registerables } = await import('chart.js');
        Chart.register(...registerables);
        
        // Group data by species and model
        speciesGroups = {};
        
        // First pass: collect all unique species to determine color count
        const uniqueSpecies = new Set();
        chartData.forEach((point: any) => {
            const speciesKey = `${point.species_code} - ${point.species_name}`;
            uniqueSpecies.add(speciesKey);
        });
        
        // Generate colors for all species
        const colors = generateSoothingColors(uniqueSpecies.size);
        
        chartData.forEach((point: any) => {
            const speciesKey = `${point.species_code} - ${point.species_name}`;
            if (!speciesGroups[speciesKey]) {
                const colorIndex = Array.from(uniqueSpecies).indexOf(speciesKey);
                const color = colors[colorIndex];
                
                speciesGroups[speciesKey] = { 
                    dbh: [], 
                    height: [], 
                    modelName: point.model_name || 'Unknown Model',
                    color: color,
                    treeCount: 0
                };
                
                // Initialize visibility state
                if (!(speciesKey in speciesVisibility)) {
                    speciesVisibility[speciesKey] = true;
                }
            }
            speciesGroups[speciesKey].dbh.push(point.dbh);
            speciesGroups[speciesKey].height.push(point.height_predicted);
            speciesGroups[speciesKey].treeCount++;
        });
        
        // Set all species as visible by default
        Object.keys(speciesGroups).forEach(speciesKey => {
            speciesVisibility[speciesKey] = true;
        });
        
        // Update allSpeciesVisible based on initial state
        allSpeciesVisible = true;
        
        debug('Species groups:', speciesGroups);
        
        // Prepare datasets for Chart.js - sort based on current sort mode
        const sortedSpeciesEntries = Object.entries(speciesGroups).sort(([a, dataA], [b, dataB]) => {
            if (sortByTreeCount) {
                // Sort by tree count (descending - most trees first)
                return dataB.treeCount - dataA.treeCount;
            } else {
                // Sort alphabetically by species name
                const nameA = a.split(' - ')[1] || 'Unknown Species';
                const nameB = b.split(' - ')[1] || 'Unknown Species';
                return nameA.localeCompare(nameB);
            }
        });
        
        const datasets = sortedSpeciesEntries.map(([speciesKey, data]) => {
            // Extract species name from the key and format label
            const speciesName = speciesKey.split(' - ')[1] || 'Unknown Species';
            const label = `${speciesName} (${data.modelName})`;
            
            return {
                label: label,
                data: data.dbh.map((dbh, i) => ({ x: dbh, y: data.height[i] })),
                backgroundColor: data.color + '20',
                borderColor: data.color,
                borderWidth: 2,
                pointBackgroundColor: data.color,
                pointBorderColor: data.color,
                pointRadius: 2,
                pointHoverRadius: 4,
                tension: 0.1,
                hidden: !speciesVisibility[speciesKey]
            };
        });
        
        debug('Chart datasets:', datasets);
        
        // Create the chart
        try {
            chartInstance = new Chart(chartCanvas, {
                type: 'scatter',
                data: {
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Height-Diameter Relationship - ${selectedPhyZoneData?.physiography_name || `Zone ${selectedPhyZone}`}`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    const point = context.raw;
                                    return `${context.dataset.label}: DBH=${point.x.toFixed(2)}cm, Height=${point.y.toFixed(2)}m`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Diameter at Breast Height (cm)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Predicted Height (m)',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'point'
                    }
                }
            });
            debug('Chart created successfully');
        } catch (error) {
            debug('Error creating chart:', error);
        }
    }
    
    // Toggle species visibility
    function toggleSpeciesVisibility(speciesKey: string) {
        const currentState = speciesVisibility[speciesKey] || false;
        speciesVisibility[speciesKey] = !currentState;
        debug(`Toggled ${speciesKey}: ${currentState} -> ${!currentState}`);
        updateChartVisibility();
    }
    
    // Toggle all species visibility
    function toggleAllSpecies() {
        allSpeciesVisible = !allSpeciesVisible;
        Object.keys(speciesVisibility).forEach(key => {
            speciesVisibility[key] = allSpeciesVisible;
        });
        updateChartVisibility();
    }
    
    // Toggle sort mode
    function toggleSortMode() {
        sortByTreeCount = !sortByTreeCount;
        // Re-render chart with new sort order
        if (chartData.length > 0 && chartCanvas && !isLoadingChartData) {
            setTimeout(() => {
                renderChart();
            }, 100);
        }
    }
    
    // Update chart visibility
    function updateChartVisibility() {
        if (chartInstance) {
            // Get the sorted species keys to match with chart datasets (same order as legend)
            const sortedSpeciesKeys = Object.keys(speciesGroups).sort((a, b) => {
                if (sortByTreeCount) {
                    // Sort by tree count (descending - most trees first)
                    return speciesGroups[b].treeCount - speciesGroups[a].treeCount;
                } else {
                    // Sort alphabetically by species name
                    const nameA = a.split(' - ')[1] || 'Unknown Species';
                    const nameB = b.split(' - ')[1] || 'Unknown Species';
                    return nameA.localeCompare(nameB);
                }
            });
            
            debug('Updating chart visibility:', sortedSpeciesKeys.map(key => ({ key, visible: speciesVisibility[key] })));
            
            chartInstance.data.datasets.forEach((dataset: any, index: number) => {
                const speciesKey = sortedSpeciesKeys[index];
                if (speciesKey && speciesVisibility[speciesKey] !== undefined) {
                    const shouldHide = !speciesVisibility[speciesKey];
                    dataset.hidden = shouldHide;
                    debug(`Dataset ${index} (${speciesKey}): hidden = ${shouldHide}`);
                }
            });
            chartInstance.update();
        }
    }
    
    // Close modal and cleanup
    function closeModal() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        onclose();
    }
    
    // Load data when modal opens
    $effect(() => {
        if (showModal && currentProjectId && selectedPhyZone) {
            loadChartData();
        }
    });
    
    // Render chart when data changes
    $effect(() => {
        if (chartData.length > 0 && chartCanvas && !isLoadingChartData) {
            // Small delay to ensure canvas is ready
            setTimeout(() => {
                renderChart();
            }, 100);
        }
    });
    
    // Cleanup on destroy
    onDestroy(() => {
        if (chartInstance) {
            chartInstance.destroy();
        }
    });
</script>

<!-- H-D Relation Modal -->
{#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-7xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" data-modal="hd-relation">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <BarChart3 class="h-5 w-5 text-emerald-600" />
                    H-D Relation Chart - {selectedPhyZoneData?.physiography_name || selectedPhyZone}
                </h3>
                <button 
                    onclick={closeModal}
                    class="p-2 hover:bg-slate-100 rounded-lg"
                >
                    <X class="w-5 h-5 text-slate-600" />
                </button>
            </div>
            
            <!-- Main Content Area -->
            <div class="flex-1 flex gap-4 min-h-0">
                <!-- Chart Container -->
                <div class="flex-1 bg-slate-50 rounded-lg p-4">
                    {#if isLoadingChartData}
                        <div class="flex items-center justify-center h-96">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            <span class="ml-3 text-slate-600">Loading chart data...</span>
                        </div>
                    {:else if chartData.length === 0}
                        <div class="flex items-center justify-center h-96 text-slate-500">
                            <div class="text-center">
                                <BarChart3 class="h-12 w-12 mx-auto mb-3 text-slate-400" />
                                <p>No data available for the selected zone</p>
                            </div>
                        </div>
                    {:else}
                        <div class="relative h-full">
                            <canvas 
                                bind:this={chartCanvas}
                                width="800" 
                                height="400"
                                class="w-full h-full"
                            ></canvas>
                        </div>
                    {/if}
                </div>
                
                <!-- Legend Sidebar -->
                {#if chartData.length > 0}
                    <div class="w-80 bg-slate-50 rounded-lg p-4 flex flex-col">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-medium text-slate-900">Species Legend</h4>
                            <div class="flex gap-2">
                                <button 
                                    onclick={toggleSortMode}
                                    class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    title={sortByTreeCount ? 'Sort by species name' : 'Sort by tree count'}
                                >
                                    {sortByTreeCount ? 'Sort A-Z' : 'Sort by Trees'}
                                </button>
                                <button 
                                    onclick={toggleAllSpecies}
                                    class="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                    {allSpeciesVisible ? 'Hide All' : 'Show All'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto">
                            <div class="space-y-2">
                                {#each Object.keys(speciesGroups).sort((a, b) => {
                                    if (sortByTreeCount) {
                                        // Sort by tree count (descending - most trees first)
                                        return speciesGroups[b].treeCount - speciesGroups[a].treeCount;
                                    } else {
                                        // Sort alphabetically by species name
                                        const nameA = a.split(' - ')[1] || 'Unknown Species';
                                        const nameB = b.split(' - ')[1] || 'Unknown Species';
                                        return nameA.localeCompare(nameB);
                                    }
                                }) as speciesKey}
                                    {@const speciesName = speciesKey.split(' - ')[1] || 'Unknown Species'}
                                    {@const speciesGroup = speciesGroups[speciesKey]}
                                    {@const modelName = speciesGroup?.modelName || 'Unknown Model'}
                                    {@const color = speciesGroup?.color || '#CCCCCC'}
                                    {@const treeCount = speciesGroup?.treeCount || 0}
                                    
                                    <div 
                                        onclick={() => toggleSpeciesVisibility(speciesKey)}
                                        class="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-slate-50 transition-all duration-200 {speciesVisibility[speciesKey] ? 'opacity-100' : 'opacity-50'}"
                                    >
                                        <div 
                                            class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                                            style="border-color: {color}; background-color: {speciesVisibility[speciesKey] ? color + '20' : 'transparent'}"
                                        >
                                            {#if speciesVisibility[speciesKey]}
                                                <div class="w-2 h-2 rounded-full" style="background-color: {color}"></div>
                                            {/if}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between">
                                                <div class="text-sm font-medium truncate {speciesVisibility[speciesKey] ? 'text-slate-900' : 'text-slate-400'}" title="{speciesName} ({modelName})">
                                                    {speciesName}
                                                </div>
                                                <div class="text-xs text-slate-500 ml-2">
                                                    {treeCount}
                                                </div>
                                            </div>
                                            <div class="text-xs truncate {speciesVisibility[speciesKey] ? 'text-emerald-600 font-medium' : 'text-slate-300'}" title="{modelName}">
                                                {modelName}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- Chart Info -->
            {#if chartData.length > 0}
                <div class="mt-4 p-3 bg-slate-100 rounded-lg">
                    <div class="text-sm text-slate-600">
                        <p><strong>Total Trees:</strong> {chartData.length} | <strong>Species:</strong> {new Set(chartData.map(d => d.species_code)).size} | <strong>Plots:</strong> {new Set(chartData.map(d => d.plot_code)).size}</p>
                    </div>
                </div>
            {/if}
            
            <!-- Close Button -->
            <div class="mt-6 flex justify-end">
                <button 
                    onclick={closeModal}
                    class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
