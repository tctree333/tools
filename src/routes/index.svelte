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
	or something custom I haven't found anywhere else. Who knows, maybe they might be useful to you!
</p>
<h2>Utilities:</h2>
<div class="not-prose">
	<ul class="grid gap-4">
		{#each tools as tool}
			<li class="flex-1">
				<a class="rounded-md bg-stone-100 px-4 py-3 block leading-relaxed h-full" href={tool.path}>
					<span class="font-medium sm:text-lg md:text-xl">{tool.title}</span>
					<br />
					<span class="md:text-lg text-stone-600">{tool.description}</span>
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	ul {
		grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
	}
</style>
