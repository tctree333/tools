<script lang="ts">
	let value = '';
	let boundaries = '\\s—–/,';

	let boundaryRegex: RegExp;
	$: {
		try {
			boundaryRegex = new RegExp(`[${boundaries}]+`);
		} catch (e) {}
	}
	$: words = value ? value.split(boundaryRegex).length : 0;
	$: characters = value ? value.length : 0;
</script>

<textarea bind:value />
<label>
	Word boundaries:
	<input type="text" bind:value={boundaries} />
</label>
<p>Words: {words}</p>
<p>Characters: {characters}</p>
