<script context="module" lang="ts">
	throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

	// export const metadata = {
	// 	title: 'Extract Numbers to Table',
	// 	description: 'Pull out numbers from text and create a table.'
	// };
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let input = '1 some text here 2 3 4 5\n20 more text wow 40 5 55 8';

	let table: (string | number)[][];

	$: table = input
		.split('\n')
		.map((row) =>
			[...row.matchAll(/\d+|(?:[^\d\s]\s[^\d\s]|[^\d\s])+/g)].map((res) => res[0].trim())
		);
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Extract Numbers to Table</h1>

<p>
	This utility does the somewhat oddly specific task of converting text with numbers and words into
	a table, with numbers in their own cell. Groups of words are kept together.
</p>
<p>
	This is useful specifically for certain Science Olympiad tournament result PDFs, where
	copy/pasting into Google Sheets doesn't work and you're too lazy to use some PDF table extracting
	software.
</p>

<textarea class="w-full block" bind:value={input} rows="10" />
{#if table}
	<table class="not-prose">
		<tbody>
			{#each table as row}
				{#if row}
					<tr>
						{#each row as cell}
							<td>{cell}</td>
						{/each}
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
{/if}

<style lang="postcss">
	tbody tr + tr {
		border-top-width: 1px;
		@apply border-stone-300;
	}
	tr td + td {
		border-left-width: 1px;
		@apply border-stone-300;
	}
</style>
