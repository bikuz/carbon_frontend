import { writable } from 'svelte/store';

export const projectStore = writable({
    id: null as string | null,
    name: 'Forest Biometric Analysis'
});
