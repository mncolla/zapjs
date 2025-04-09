<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';

    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;
    let debounceTimer: NodeJS.Timeout;
    let error: string = '';
    let isLoading: boolean = false;
    let editorWidth: number = 67; // Porcentaje inicial
    let isResizing: boolean = false;
    let logs: string[] = [];

    function startResize(_e: MouseEvent) {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }

    function handleResize(e: MouseEvent) {
        if (!isResizing) return;
        
        const containerWidth = window.innerWidth;
        const newWidth = (e.clientX / containerWidth) * 100;
        
        // Limitar el ancho entre 30% y 70%
        editorWidth = Math.min(Math.max(newWidth, 30), 70);
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }

    function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);
		editor.setModel(model);
        handleContentChange()
	}

    async function handleContentChange() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const content = editor.getValue();
            if (!content.trim()) {
                error = '';
                logs = [];
                return;
            }

            if (!window.api?.executeCode) {
                error = 'Error: La API de ejecución no está disponible. Por favor, reinicia la aplicación.';
                logs = [];
                return;
            }

            isLoading = true;
            try {
                const result = await window.api.executeCode(content);
                if (result.success) {
                    error = '';
                    logs = result.logs || [];
                } else {
                    error = result.error || 'Error desconocido';
                    logs = [];
                }
            } catch (err) {
                console.error('Error al ejecutar código:', err);
                error = 'Error al ejecutar el código';
                logs = [];
            } finally {
                isLoading = false;
            }
        }, 1000);
    }

    onMount(async () => {
		self.MonacoEnvironment = {
			getWorker: function (_: any, _label: string) {
				return new tsWorker();
			}
		};

		monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

		editor = monaco.editor.create(editorElement, {
			automaticLayout: true,
			theme: 'vs-dark',
            minimap: {
                enabled: false
            },
            lineNumbers: 'off',
            fontSize: 14,
		});

		loadCode(`console.log('Hola mundo');`, 'javascript');
        
        editor.onDidChangeModelContent(handleContentChange);
	});

    onDestroy(() => {
        clearTimeout(debounceTimer);
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<div class="flex h-screen w-full">
    <div 
        class="relative" 
        style="width: {editorWidth}%"
    >
        <div class="h-full" bind:this={editorElement}></div>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="relative w-[2px] cursor-col-resize hover:bg-blue-500 transition-colors"
        on:mousedown={startResize}
    ></div>
    <div 
        class="relative bg-gray-900 p-4 overflow-auto" 
        style="width: {100 - editorWidth}%"
    >
        <div class="text-white">
            {#if isLoading}
                <div class="text-gray-400 mb-4">Ejecutando código...</div>
            {:else if error}
                <div class="text-red-500 mb-4 font-mono">{error}</div>
            {:else}
                {#if logs.length > 0}
                    <div class="mb-4">
                        {#each logs as log}
                            <pre class="whitespace-pre-wrap font-mono text-gray-300 mb-1">{log}</pre>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>