<script context="module" lang="ts">
	export const metadata = {
		title: 'Big Text',
		description: 'A text area, but big.'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let size = 64;
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Big Text Box</h1>

<textarea
	class="w-full block mb-4 text-xl"
	rows="8"
	style="font-size: {size}px; line-height: 1.1;"
/>

<div class="flex flex-row items-center space-x-2">
	<label>
		Text Size:
		<input bind:value={size} type="number" class="border-2 border-stone-400" />
	</label>
	<button on:click={() => size--} type="button" class="rounded-full px-4 border-2 border-stone-400"
		>-</button
	>
	<button on:click={() => size++} type="button" class="rounded-full px-4 border-2 border-stone-400"
		>+</button
	>
</div>

<style>
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
		width: 3em;
	}
</style>
