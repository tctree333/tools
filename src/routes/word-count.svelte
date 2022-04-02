<script context="module" lang="ts">
	export const metadata = {
		title: 'Word Count',
		description:
			'Count the number of words and characters within text, with configurable word boundaries!'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let value = '';
	let boundaries = '\\s';

	let boundaryRegex: RegExp;
	$: {
		try {
			boundaryRegex = new RegExp(`[${boundaries}]+`);
		} catch (e) {}
	}
	$: words = value ? value.split(boundaryRegex).filter((w) => w !== '').length : 0;
	$: characters = value ? value.length : 0;
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Word Count</h1>
<textarea bind:value class="block w-full mb-4" rows="14" />
<label>
	Word boundaries:
	<input type="text" bind:value={boundaries} />
</label>
<p class="mb-2"><span class="font-medium">Words:</span> {words}</p>
<p class="mt-0"><span class="font-medium">Characters:</span> {characters}</p>
