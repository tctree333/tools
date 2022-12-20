<script context="module" lang="ts">
	export const metadata = {
		title: 'Room LED Control',
		description: 'Control lights on the local network.'
	};
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import Head from '$lib/components/Head.svelte';
	import ColorPicker, { type ColorInfo } from '$lib/components/inputs/ColorPicker.svelte';
	import { onMount } from 'svelte';

	let ipAddress = $page.url.hash.slice(1) || '0.0.0.0';
	let color: ColorInfo = {
		hue: 0,
		saturation: 0,
		brightness: 100,
		hex: 'FFFFFF'
	};
	let setColorFromHex: (hex: string) => void;

	let colorMode: 'rainbow' | 'pureRandom' | 'randomAround' | 'breathe' | 'manual';
	let brightness: number;

	function update(command: string) {
		if (browser && loaded) {
			fetch(`http://${ipAddress}/?${command}`, {
				mode: 'no-cors'
			});
		}
	}

	let timeout: NodeJS.Timeout;
	function updateColor(hex: string) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			update('$' + hex);
			setTimeout(() => {
				update(colorMode);
			}, 100);
		}, 100);
	}

	let loaded = false;
	onMount(() => {
		fetch(`http://${ipAddress}/status`, {
			mode: 'cors'
		})
			.then((res) => res.json())
			.then((data) => {
				colorMode = data.mode;
				brightness = Math.round(100 * (data.brightness / 255));
				setColorFromHex(data.color.toString(16).padStart(6, '0'));
				loaded = true;
			});
	});

	$: updateColor(color.hex);
	$: update(colorMode);
	$: update(
		`B${Math.round((brightness / 100) * 255)
			.toString(16)
			.padStart(2, '0')}`
	);
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Room LED Control</h1>

<details>
	<summary class="underline cursor-pointer">What's this?</summary>
	<p>
		This is the web interface for a project controlling lights over the local network. For more
		information on this project, check out <a href="https://github.com/tctree333/room-lights"
			>this GitHub repo</a
		>.
	</p>
</details>

<p class="mb-4">IP Address: <code>{ipAddress}</code> (set this using the url hash)</p>

<label class="inline-block mb-4">
	Color Mode:
	<select class="border-2 border-stone-400" bind:value={colorMode}
		><option value="rainbow" selected>Rainbow</option><option value="pureRandom">Pure Random</option
		><option value="randomAround">Random Around</option><option value="manual">Solid Color</option>
	</select>
</label>

<br />

<button
	on:click={() => {
		update('on');
	}}
	type="button"
	class="mb-8 px-4 py-0.5 border-2 border-stone-400">On</button
>
<button
	on:click={() => {
		update('off');
	}}
	type="button"
	class="mb-8 px-4 py-0.5 border-2 border-stone-400">Off</button
>

<div class="not-prose flex">
	<ColorPicker class="w-96 mb-8" bind:color bind:setColorFromHex />
</div>

<label>
	Brightness: <input
		type="number"
		min="0"
		max="100"
		bind:value={brightness}
		class="border-2 border-stone-400 w-24"
	/>
</label>
