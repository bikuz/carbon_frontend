<script lang="ts">
    import { Upload, File, X } from '@lucide/svelte';
    
    // interface UploadedFile {
    //   id: number;
    //   name: string;
    //   size: number;
    //   type: string;
    //   file: File;
    // }
    
    let { onUpload } = $props<{ onUpload?: (files: any[]) => void }>();
    let isDragOver = $state(false);
    let uploadedFiles = $state<any[]>([]);
    
    function handleDragOver(event: DragEvent) {
      event.preventDefault();
      isDragOver = true;
    }
    
    function handleDragLeave(event: DragEvent) {
      event.preventDefault();
      isDragOver = false;
    }
    
    function handleDrop(event: DragEvent) {
      event.preventDefault();
      isDragOver = false;
      
      const files = Array.from(event.dataTransfer?.files || []);
      processFiles(files);
    }
    
    function handleFileInput(event: Event) {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      processFiles(files);
    }
    
    function processFiles(files:any[]) {
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      }));
      
      uploadedFiles = [...uploadedFiles, ...newFiles];
      onUpload?.(newFiles);
    }
    
    function removeFile(fileId: number) {
      uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    }
    
    function formatFileSize(bytes: number) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  </script>
  
  <div class="space-y-4">
    <!-- Drop Zone -->
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center transition-colors
             {isDragOver 
               ? 'border-emerald-400 bg-emerald-50' 
               : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'}"
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
    >
      <Upload class="mx-auto text-slate-400 mb-4" size={48} />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">Upload Foris Data</h3>
      <p class="text-slate-600 mb-4">Drag and drop your ZIP files here, or click to browse</p>
      
      <input
        type="file"
        multiple
        accept=".zip,.csv,.xlsx"
        class="hidden"
        onchange={handleFileInput}
        id="file-upload"
      />
      
      <label
        for="file-upload"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
      >
        <Upload size={16} />
        Choose Files
      </label>
      
      <p class="text-xs text-slate-500 mt-2">Supports ZIP file for SQL</p>
    </div>
  
    <!-- Uploaded Files -->
    {#if uploadedFiles.length > 0}
      <div class="space-y-2">
        <h4 class="font-medium text-slate-900">Uploaded Files ({uploadedFiles.length})</h4>
        <div class="space-y-2">
          {#each uploadedFiles as file}
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div class="flex items-center gap-3">
                <File class="text-slate-400" size={16} />
                <div>
                  <p class="font-medium text-slate-900">{file.name}</p>
                  <p class="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onclick={() => removeFile(file.id)}
                class="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  