<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async () => {
		const modules = import.meta.glob('./*.svelte');
		const tools = await Promise.all(
			Object.entries(modules)
				.filter(([filename, _]) => !filename.startsWith('./_'))
				.map(async ([filename, module]) => {
					const { metadata } = await module();
					return { path: `/${filename.slice(2, -7)}/`, ...metadata };
				})
		);
		return {
			props: {
				tools
			}
		};
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	export let tools: [{ path: string; title: string; description: string }];
</script>

<Head
	title="Tools"
	description="A collection of assorted utilites that may or may not be useful at any given moment."
/>

<h1>Tomi's Tools</h1>
<p>A collection of assorted utilites that may or may not be useful at any given moment.</p>
<p>
	I've decided not to add encoding/decoding/etc. utilities since <a
		href="https://gchq.github.io/CyberChef/">CyberChef</a
	> can do a better job than I could ever. The utilites here are either simple enough to collect together,
	or something I haven't found anywhere else.
</p>
<h2>Utilities:</h2>
<ul>
	{#each tools as tool}
		<li><a href={tool.path}>{tool.title}</a> - {tool.description}</li>
	{/each}
</ul>
