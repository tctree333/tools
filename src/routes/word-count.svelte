<script lang="ts">
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

<h1>Word Count</h1>
<textarea bind:value class="block w-full mb-4" rows="14" />
<label>
	Word boundaries:
	<input type="text" bind:value={boundaries} />
</label>
<p class="mb-2"><span class="font-medium">Words:</span> {words}</p>
<p class="mt-0"><span class="font-medium">Characters:</span> {characters}</p>
