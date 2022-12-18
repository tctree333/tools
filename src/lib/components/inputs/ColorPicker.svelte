<script lang="ts" context="module">
	export interface ColorInfo {
		hue: number;
		saturation: number;
		brightness: number;
		hex: string;
	}
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import ColorPickerContrastLine, { HSBToRGB } from './ColorPickerContrastLine.svelte';

	let className = '';
	export { className as class };

	export let contrastRatio = 0;
	export let against = '';

	export let color: ColorInfo = {
		hue: 0,
		saturation: 0,
		brightness: 0,
		hex: '#000000'
	};

	let { hue, saturation, brightness, hex } = color;

	$: {
		color = {
			hue,
			saturation,
			brightness,
			hex
		};
		color = color;
	}

	$: hex = HSBToRGB(hue, saturation, brightness)
		.map((c) => Math.round(c).toString(16).padStart(2, '0'))
		.join('');

	let hueMouseDown = false;
	let pickerMouseDown = false;
	$: {
		if (browser) {
			if (pickerMouseDown || hueMouseDown) {
				document.body.classList.add('noselect', 'overflow-y-hidden', 'h-full');
			} else {
				document.body.classList.remove('noselect', 'overflow-y-hidden', 'h-full');
			}
		}
	}

	let hueFocus = false;
	let pickerFocus = false;

	let huePicker: HTMLDivElement;
	let colorPicker: HTMLDivElement;

	// 16 is the content width of the picker circle
	$: huePickerWidth = huePicker?.getBoundingClientRect()?.width - 16 ?? 0;
	// 8 is half of 16, the content width of the picker circle
	$: huePickerOffset = huePicker?.getBoundingClientRect()?.x + 8 ?? 0;
	$: huePickerX = (hue / 360) * huePickerWidth;
	function setHueFromMousePos(x: number) {
		hue = Math.round(
			(Math.min(Math.max(0, x - huePickerOffset), huePickerWidth) / huePickerWidth) * 360
		);
	}

	$: colorPickerWidth = colorPicker?.getBoundingClientRect()?.width - 16 ?? 0;
	$: colorPickerHeight = colorPicker?.getBoundingClientRect()?.height - 16 ?? 0;
	$: colorPickerOffsetX = colorPicker?.getBoundingClientRect()?.x + 8 ?? 0;
	$: colorPickerOffsetY = colorPicker?.getBoundingClientRect()?.y + 8 ?? 0;
	$: colorPickerX = (saturation / 100) * colorPickerWidth;
	$: colorPickerY = ((100 - brightness) / 100) * colorPickerHeight;
	function setColorFromMousePos(x: number, y: number) {
		saturation = Math.round(
			(Math.min(Math.max(0, x - colorPickerOffsetX), colorPickerWidth) / colorPickerWidth) * 100
		);
		brightness =
			100 -
			Math.round(
				(Math.min(Math.max(0, y - colorPickerOffsetY), colorPickerHeight) / colorPickerHeight) * 100
			);
	}
</script>

<svelte:window
	on:pointerup|preventDefault={() => {
		hueMouseDown = false;
		pickerMouseDown = false;
	}}
	on:pointermove|preventDefault={(e) => {
		if (hueMouseDown) {
			setHueFromMousePos(e.pageX);
		}
		if (pickerMouseDown) {
			setColorFromMousePos(e.pageX, e.pageY);
		}
	}}
	on:keydown={(e) => {
		if (
			(hueFocus || pickerFocus) &&
			['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)
		) {
			e.preventDefault();
			e.stopPropagation();
		}

		if (hueFocus) {
			if (e.key === 'ArrowRight') {
				hue = Math.min(Math.max(0, hue + 1), 360);
			}
			if (e.key === 'ArrowLeft') {
				hue = Math.min(Math.max(0, hue - 1), 360);
			}
		}
		if (pickerFocus) {
			if (e.key === 'ArrowRight') {
				saturation = Math.min(Math.max(0, saturation + 1), 100);
			}
			if (e.key === 'ArrowLeft') {
				saturation = Math.min(Math.max(0, saturation - 1), 100);
			}
			if (e.key === 'ArrowUp') {
				brightness = Math.min(Math.max(0, brightness + 1), 100);
			}
			if (e.key === 'ArrowDown') {
				brightness = Math.min(Math.max(0, brightness - 1), 100);
			}
		}
	}}
/>

<div class={className}>
	<div
		class="w-full aspect-square mb-4 color-picker rounded-lg relative"
		style="--hue: {hue};"
		bind:this={colorPicker}
		on:pointerdown|preventDefault={() => (pickerMouseDown = true)}
		on:click={(e) => {
			setColorFromMousePos(e.pageX, e.pageY);
		}}
	>
		{#if contrastRatio > 0}
			<ColorPickerContrastLine {hue} {contrastRatio} {against} />
		{/if}
		<div
			on:focus={() => (pickerFocus = true)}
			on:blur={() => (pickerFocus = false)}
			tabindex="0"
			class="absolute rounded-full w-4 h-4 ring-gray-400 ring-offset-white ring-1 ring-offset-4 transform outline-none focus:ring-blue-500"
			style="--tw-translate-x: {colorPickerX}px; --tw-translate-y: {colorPickerY}px;"
		/>
	</div>
	<div
		class="w-full h-4 relative hue-picker rounded-full"
		bind:this={huePicker}
		on:pointerdown|preventDefault={() => (hueMouseDown = true)}
		on:click={(e) => {
			setHueFromMousePos(e.pageX);
		}}
	>
		<div
			on:focus={() => (hueFocus = true)}
			on:blur={() => (hueFocus = false)}
			tabindex="0"
			class="absolute rounded-full w-4 h-4 ring-gray-400 ring-offset-white ring-1 ring-offset-4 transform outline-none focus:ring-blue-500"
			style="--tw-translate-x: {huePickerX}px;"
		/>
	</div>
</div>

<style>
	div.color-picker {
		--hue: 0;
		background: linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%) repeat scroll 0% 0%,
			rgba(0, 0, 0, 0)
				linear-gradient(to right, rgb(255, 255, 255) 0%, hsl(var(--hue), 100%, 50%) 100%) repeat
				scroll 0% 0%;
		box-shadow: inset rgba(0, 0, 0, 0.075) 0 0 0 1px;
	}
	div.hue-picker {
		background: rgba(0, 0, 0, 0)
			linear-gradient(
				to right,
				rgb(255, 0, 0),
				rgb(255, 255, 0),
				rgb(0, 255, 0),
				rgb(0, 255, 255),
				rgb(0, 0, 255),
				rgb(255, 0, 255),
				rgb(255, 0, 0)
			)
			repeat scroll 0% 0%;
	}
	:global(.noselect) {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style>
