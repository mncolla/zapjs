<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';

    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;
    let debounceTimer: NodeJS.Timeout;
    let output: string = '';
    let error: string = '';
    let isLoading: boolean = false;
    let editorWidth: number = 67; // Porcentaje inicial
    let isResizing: boolean = false;

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
                output = '';
                error = '';
                return;
            }

            if (!window.api?.executeCode) {
                error = 'Error: La API de ejecución no está disponible. Por favor, reinicia la aplicación.';
                output = '';
                return;
            }

            isLoading = true;
            try {
                const result = await window.api.executeCode(content);
                if (result.success) {
                    error = '';
                    output = result.result || '';
                } else {
                    error = result.error || 'Error desconocido';
                    output = '';
                }
            } catch (err) {
                console.error('Error al ejecutar código:', err);
                error = 'Error al ejecutar el código';
                output = '';
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

		loadCode(`// Escribe tu código aquí
console.log('Hola mundo');

// También puedes usar expresiones
const a = 1 + 2;
a;`, 'javascript');
        
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
        class="relative bg-gray-800 p-4 overflow-auto" 
        style="width: {100 - editorWidth}%"
    >
        <div class="text-white">
            <h2 class="text-xl font-bold mb-4">Salida:</h2>
            {#if isLoading}
                <div class="text-gray-400 mb-4">Ejecutando código...</div>
            {:else if error}
                <div class="text-red-500 mb-4 font-mono">{error}</div>
            {:else}
                <pre class="whitespace-pre-wrap font-mono">{output}</pre>
            {/if}
        </div>
    </div>
</div>