<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ tools } = data);
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
				<a
					class="rounded-md bg-stone-200 px-4 py-3 block leading-relaxed h-full dark:bg-stone-900"
					href={tool.path}
				>
					<span class="font-medium text-stone-900 sm:text-lg md:text-xl dark:text-stone-50"
						>{tool.title}</span
					>
					<br />
					<span class="md:text-lg">{tool.description}</span>
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
