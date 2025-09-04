<script lang="ts">
    import { CheckCircle, AlertTriangle, AlertCircle, Info } from '@lucide/svelte';

    // Props
    let { 
        validationResults = $bindable<any>(null),
        isLoading = $bindable<boolean>(false)
    } = $props();

    function formatNumber(num: number): string {
        return new Intl.NumberFormat().format(num);
    }
</script>

<div class="space-y-6">
    <div>
        <h2 class="text-xl font-semibold text-slate-900 mb-4">Data Quality Assessment</h2>
        <p class="text-slate-600 mb-6">
            Reviewing your data for completeness, format consistency, and potential issues.
        </p>
    </div>

    {#if isLoading}
        <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p class="text-slate-600 mt-2">Validating data...</p>
        </div>
    {:else if validationResults}
        <!-- Data Quality Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <Info size={16} class="text-emerald-600" />
                    <span class="text-sm font-medium text-emerald-800">Total Records</span>
                </div>
                <div class="text-2xl font-bold text-emerald-600">{formatNumber(validationResults.totalRows)}</div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} class="text-green-600" />
                    <span class="text-sm font-medium text-green-800">Valid Records</span>
                </div>
                <div class="text-2xl font-bold text-green-600">{formatNumber(validationResults.validRows)}</div>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} class="text-red-600" />
                    <span class="text-sm font-medium text-red-800">Errors Found</span>
                </div>
                <div class="text-2xl font-bold text-red-600">{formatNumber(validationResults.errors)}</div>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} class="text-yellow-600" />
                    <span class="text-sm font-medium text-yellow-800">Warnings</span>
                </div>
                <div class="text-2xl font-bold text-yellow-600">{formatNumber(validationResults.warnings)}</div>
            </div>
        </div>

        <!-- Data Quality Details -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Quality Metrics</h3>
            
            <div class="space-y-4">
                <!-- Data Completeness -->
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                        <span class="font-medium text-slate-900">Data Completeness</span>
                        <p class="text-sm text-slate-600">Percentage of records with all required fields</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-slate-900">
                            {validationResults.totalRows > 0 ? Math.round((validationResults.validRows / validationResults.totalRows) * 100) : 0}%
                        </div>
                        <div class="text-sm text-slate-600">
                            {formatNumber(validationResults.validRows)} / {formatNumber(validationResults.totalRows)}
                        </div>
                    </div>
                </div>

                <!-- Error Rate -->
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                        <span class="font-medium text-slate-900">Error Rate</span>
                        <p class="text-sm text-slate-600">Percentage of records with critical errors</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-red-600">
                            {validationResults.totalRows > 0 ? Math.round((validationResults.errors / validationResults.totalRows) * 100) : 0}%
                        </div>
                        <div class="text-sm text-slate-600">
                            {formatNumber(validationResults.errors)} errors
                        </div>
                    </div>
                </div>

                <!-- Warning Rate -->
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                        <span class="font-medium text-slate-900">Warning Rate</span>
                        <p class="text-sm text-slate-600">Percentage of records with warnings</p>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-yellow-600">
                            {validationResults.totalRows > 0 ? Math.round((validationResults.warnings / validationResults.totalRows) * 100) : 0}%
                        </div>
                        <div class="text-sm text-slate-600">
                            {formatNumber(validationResults.warnings)} warnings
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quality Assessment Summary -->
        {#if validationResults.errors === 0 && validationResults.warnings === 0}
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div class="flex items-center gap-2 text-emerald-700">
                    <CheckCircle size={20} />
                    <span class="font-medium">Excellent Data Quality</span>
                </div>
                <p class="text-emerald-600 mt-1">
                    Your data has passed all quality checks. No errors or warnings detected.
                </p>
            </div>
        {:else if validationResults.errors === 0}
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle size={20} />
                    <span class="font-medium">Good Data Quality with Warnings</span>
                </div>
                <p class="text-yellow-600 mt-1">
                    Your data is generally good but has some warnings that should be reviewed.
                </p>
            </div>
        {:else}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <span class="font-medium">Data Quality Issues Detected</span>
                </div>
                <p class="text-red-600 mt-1">
                    Your data has errors that need to be addressed before proceeding with analysis.
                </p>
            </div>
        {/if}
    {:else}
        <div class="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <AlertTriangle size={48} class="mx-auto mb-4 text-slate-300" />
            <h3 class="text-lg font-medium text-slate-600 mb-2">No Validation Data Available</h3>
            <p class="text-slate-500">
                Data quality assessment has not been performed yet.
            </p>
        </div>
    {/if}
</div>
