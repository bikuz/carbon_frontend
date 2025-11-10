<script lang="ts">
    import { TreePine, Database, BarChart3, Calculator, Leaf, ArrowRight, Upload } from '@lucide/svelte';
    import { goto } from '$app/navigation';
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
    <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <!-- Hero Section -->
        <div class="text-center space-y-6">
            <div class="flex justify-center">
                <div class="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <TreePine class="text-white" size={40} />
                </div>
            </div>
            <h1 class="text-5xl font-bold text-slate-900">
                Welcome to Forest Biometric Analysis System
            </h1>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">
                A comprehensive platform for analyzing forest data, calculating biomass, and estimating carbon stocks through advanced biometric modeling and statistical analysis.
            </p>
        </div>

        <!-- Key Features -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Feature 1: Data Import -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Database class="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-2">Data Import & Management</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Import forest inventory data from Foris database schemas. The system supports multiple data formats 
                            and provides data quality assessment tools to ensure your measurements are accurate and complete.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Feature 2: Height-Diameter Modeling -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BarChart3 class="text-emerald-600" size={24} />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-2">Height-Diameter Modeling</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Build and apply species-specific height-diameter models to predict tree heights. 
                            Assign models based on species and physiography zones for accurate height predictions.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Feature 3: Volume Calculation -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calculator class="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-2">Volume Ratio Calculation</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Calculate volume ratios for broken trees using Fibonacci taper functions. 
                            Correct for trees with broken tops to ensure accurate biomass estimates.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Feature 4: Carbon Analysis -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-md p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Leaf class="text-amber-600" size={24} />
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-2">Carbon Stock Estimation</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Calculate tree biomass (stem, branch, and foliage) and estimate carbon stocks. 
                            Apply allometric equations and species-specific parameters for precise carbon accounting.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Workflow Overview -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Analysis Workflow</h2>
            <div class="space-y-4">
                <div class="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div class="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        1
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900 mb-1">Data Selection & Validation</h3>
                        <p class="text-slate-600 text-sm">
                            Import and validate your forest inventory data. Select schemas and tables, assess data quality, 
                            and clean any issues before proceeding to analysis.
                        </p>
                    </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div class="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        2
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900 mb-1">Height-Diameter Modeling</h3>
                        <p class="text-slate-600 text-sm">
                            Assign HD models to species-physiography combinations and predict tree heights for trees 
                            where height measurements are missing or need validation.
                        </p>
                    </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div class="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        3
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900 mb-1">Volume Ratio Calculation</h3>
                        <p class="text-slate-600 text-sm">
                            Calculate volume ratios for broken trees to correct biomass estimates. 
                            Apply taper functions to determine remaining volume in damaged trees.
                        </p>
                    </div>
                </div>

                <div class="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div class="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        4
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900 mb-1">Carbon Emission Calculation</h3>
                        <p class="text-slate-600 text-sm">
                            Calculate tree biomass components (stem, branch, foliage) and estimate carbon stocks. 
                            Generate comprehensive reports for carbon accounting and forest management.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Start Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
                onclick={() => goto('/inventory')}
                class="group bg-white rounded-xl border-2 border-emerald-600 shadow-md p-6 hover:shadow-lg hover:bg-emerald-50 transition-all text-left"
            >
                <div class="flex items-center justify-between mb-3">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Upload class="text-emerald-600" size={24} />
                    </div>
                    <ArrowRight class="text-emerald-600 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Import Forest Data</h3>
                <p class="text-slate-600 text-sm">
                    Start by importing your forest inventory data from Foris database schemas.
                </p>
            </button>

            <button
                onclick={() => goto('/mrv')}
                class="group bg-white rounded-xl border-2 border-emerald-600 shadow-md p-6 hover:shadow-lg hover:bg-emerald-50 transition-all text-left"
            >
                <div class="flex items-center justify-between mb-3">
                    <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <BarChart3 class="text-emerald-600" size={24} />
                    </div>
                    <ArrowRight class="text-emerald-600 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Start Analysis</h3>
                <p class="text-slate-600 text-sm">
                    Create a new analysis project or continue working on an existing one.
                </p>
            </button>
        </div>

        <!-- Footer Note -->
        <div class="text-center text-slate-500 text-sm">
            <p>Advanced forest data analysis platform for carbon accounting and forest management</p>
        </div>
    </div>
</div>

