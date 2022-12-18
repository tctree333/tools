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

	let ipAddress = $page.url.hash.slice(1) || '0.0.0.0';
	let color: ColorInfo = {
		hue: 0,
		saturation: 0,
		brightness: 100,
		hex: 'FFFFFF'
	};

	let colorMode: 'manual' | 'rainbow';

	let brightness: number = 25;

	let timeout: NodeJS.Timeout;
	function update(browser: boolean, ipAddress: string, command: string) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			if (browser) {
				fetch(`http://${ipAddress}/?${command}`, {
					mode: 'no-cors'
				});
			}
		}, 100);
	}
	$: {
		if (colorMode === 'manual') update(browser, ipAddress, '$' + color.hex);
	}

	$: {
		update(
			browser,
			ipAddress,
			`B${Math.round((brightness / 100) * 255)
				.toString(16)
				.padStart(2, '0')}`
		);
	}
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Room LED Control</h1>

<p class="mb-4">IP Address: <code>{ipAddress}</code> (set this using the url hash)</p>

<label class="block mb-4">
	Color Mode:
	<select
		class="border-2 border-stone-400"
		bind:value={colorMode}
		on:change={() => {
			if (colorMode !== 'manual') {
				update(browser, ipAddress, colorMode);
			}
		}}
		><option value="rainbow" selected>Rainbow</option><option value="random" selected>Random</option
		><option value="manual">Manual Color</option>
	</select>
</label>

<button
	on:click={() => {
		update(browser, ipAddress, 'on');
	}}
	type="button"
	class="mb-8 px-4 py-0.5 border-2 border-stone-400">On</button
>
<button
	on:click={() => {
		update(browser, ipAddress, 'off');
	}}
	type="button"
	class="mb-8 px-4 py-0.5 border-2 border-stone-400">Off</button
>

<div class="not-prose flex">
	<ColorPicker class="w-96 mb-8" bind:color />
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
