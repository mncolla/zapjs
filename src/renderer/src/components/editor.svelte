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

    function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);
		editor.setModel(model);
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
            lineNumbers: 'on',
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
    <div class="flex-grow" bind:this={editorElement}></div>
    <div class="w-1/3 bg-gray-800 p-4 overflow-auto">
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