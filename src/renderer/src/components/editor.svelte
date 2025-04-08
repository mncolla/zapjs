<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
	import * as monaco from 'monaco-editor';

    import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

    let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;
    let debounceTimer: NodeJS.Timeout;

    function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);
		editor.setModel(model);
	}

    function handleContentChange() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const content = editor.getValue();
            console.log("content", content);
        }, 500);
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
		});

		loadCode(`const a = 1;`, 'javascript');
        
        editor.onDidChangeModelContent(handleContentChange);
	});

    onDestroy(() => {
        clearTimeout(debounceTimer);
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<div class="flex h-screen w-full flex-col">
	<div class="flex-grow" bind:this={editorElement}></div>
</div>