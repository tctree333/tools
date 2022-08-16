<script context="module" lang="ts">
	throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

	// export const metadata = {
	// 	title: 'Color Contrast Picker',
	// 	description: 'A color picker with contrast boundaries.'
	// };
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import ColorPicker, { type ColorInfo } from '$lib/components/inputs/ColorPicker.svelte';
	import { contrastBetween, parseHex } from '$lib/components/inputs/ColorPickerContrastLine.svelte';

	let color1: ColorInfo = {
		hue: 0,
		saturation: 0,
		brightness: 100,
		hex: 'FFFFFF'
	};
	let color2: ColorInfo = {
		hue: 0,
		saturation: 0,
		brightness: 0,
		hex: '000000'
	};

	let contrastRatio = 7;

	$: hex = color1.hex;
	$: against = color2.hex;
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Color Contrast Picker</h1>

<div class="not-prose flex flex-row flex-wrap gap-8 justify-between">
	<ColorPicker class="w-96" bind:color={color1} bind:contrastRatio bind:against />
	<ColorPicker class="w-96" bind:color={color2} contrastRatio={0} />

	<div
		class="flex-1 grid place-content-center tabular-nums rounded-lg p-8 border-2"
		style="color: #{against}; background-color: #{hex};"
	>
		<!-- Hue: {color1.hue}<br />
		Saturation: {color1.saturation}<br />
		Brightness: {color1.brightness}<br /> -->
		Hex: #{hex}<br />
		Against: #{against}<br />
		<label
			>Contrast: <input
				type="number"
				class="w-24 bg-inherit"
				bind:value={contrastRatio}
				step="0.5"
			/></label
		><br />
		{Math.round(contrastBetween(parseHex(hex), parseHex(against)) * 100) / 100}
	</div>
</div>
