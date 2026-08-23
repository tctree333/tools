<script module lang="ts">
	export const metadata = {
		title: 'Word Count',
		description: 'Count the number of words and characters.'
	};
</script>

<script lang="ts">
	import { run } from 'svelte/legacy';

	import Head from '$lib/components/Head.svelte';

	let value = $state('');
	let boundaries = $state('\\s');

	let boundaryRegex: RegExp = $state();
	run(() => {
		try {
			boundaryRegex = new RegExp(`[${boundaries}]+`);
		} catch (e) {}
	});
	let words = $derived(value ? value.split(boundaryRegex).filter((w) => w !== '').length : 0);
	let characters = $derived(value ? value.length : 0);
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Word Count</h1>
<textarea bind:value class="block w-full mb-4" rows="14"></textarea>
<label>
	Word boundaries:
	<input type="text" bind:value={boundaries} />
</label>
<p class="mb-0!"><span class="font-medium">Words:</span> {words}</p>
<p class="mt-0!"><span class="font-medium">Characters:</span> {characters}</p>
