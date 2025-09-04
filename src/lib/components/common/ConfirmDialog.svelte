<script lang="ts">
    import { AlertTriangle, X, CheckCircle, Info, AlertCircle } from '@lucide/svelte';

    // Props
    let { 
        isVisible = $bindable<boolean>(false),
        title = $bindable<string>('Confirm Action'),
        message = $bindable<string>('Are you sure you want to proceed?'),
        confirmText = $bindable<string>('Confirm'),
        cancelText = $bindable<string>('Cancel'),
        type = $bindable<'danger' | 'warning' | 'info'>('warning'),
        requireTyping = $bindable<string | null>(null),
        onConfirm = $bindable<() => void>(() => {}),
        onCancel = $bindable<() => void>(() => {})
    } = $props();

    // State
    let typedConfirmation = $state('');
    let isConfirming = $state(false);

    // Reset typed confirmation when dialog opens
    $effect(() => {
        if (isVisible) {
            typedConfirmation = '';
        }
    });

    function handleConfirm() {
        if (requireTyping && typedConfirmation !== requireTyping) {
            return;
        }
        
        isConfirming = true;
        onConfirm();
        handleClose();
    }

    function handleCancel() {
        onCancel();
        handleClose();
    }

    function handleClose() {
        isVisible = false;
        typedConfirmation = '';
        isConfirming = false;
    }

    // Get icon and colors based on type
    function getTypeConfig() {
        switch (type) {
            case 'danger':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    textColor: 'text-red-800',
                    buttonColor: 'bg-red-600 hover:bg-red-700',
                    buttonTextColor: 'text-white'
                };
            case 'warning':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    textColor: 'text-yellow-800',
                    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
                    buttonTextColor: 'text-white'
                };
            case 'info':
                return {
                    icon: Info,
                    iconColor: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    textColor: 'text-blue-800',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700',
                    buttonTextColor: 'text-white'
                };
            default:
                return {
                    icon: Info,
                    iconColor: 'text-slate-600',
                    bgColor: 'bg-slate-50',
                    borderColor: 'border-slate-200',
                    textColor: 'text-slate-800',
                    buttonColor: 'bg-slate-600 hover:bg-slate-700',
                    buttonTextColor: 'text-white'
                };
        }
    }

    const config = getTypeConfig();
    const IconComponent = config.icon;
</script>

{#if isVisible}
    <!-- Modal Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <!-- Modal Content -->
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <IconComponent size={24} class={config.iconColor} />
                        <h2 class="text-xl font-semibold text-slate-900">{title}</h2>
                    </div>
                    <button
                        onclick={handleCancel}
                        class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={20} class="text-slate-500" />
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto flex-1">
                <div class="space-y-4">
                    <!-- Message -->
                    <div class="text-slate-700 whitespace-pre-line">
                        {message}
                    </div>

                    <!-- Type confirmation input if required -->
                    {#if requireTyping}
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-slate-700">
                                Type "{requireTyping}" to confirm:
                            </label>
                            <input
                                type="text"
                                bind:value={typedConfirmation}
                                placeholder={requireTyping}
                                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
                <button
                    onclick={handleCancel}
                    disabled={isConfirming}
                    class="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onclick={handleConfirm}
                    disabled={isConfirming || (requireTyping && typedConfirmation !== requireTyping)}
                    class="px-6 py-2 {config.buttonColor} {config.buttonTextColor} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {#if isConfirming}
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    {/if}
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
{/if}
