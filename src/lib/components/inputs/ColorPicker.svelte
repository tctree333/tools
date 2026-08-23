<script lang="ts" module>
	export interface ColorInfo {
		hue: number;
		saturation: number;
		brightness: number;
		hex: string;
	}
</script>

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { browser } from '$app/environment';
	import ColorPickerContrastLine, {
		HSBToRGB,
		parseHex,
		RGBToHSB
	} from './ColorPickerContrastLine.svelte';

	interface Props {
		class?: string;
		contrastRatio?: number;
		against?: string;
		color?: ColorInfo;
	}

	let {
		class: className = '',
		contrastRatio = 0,
		against = '',
		color = $bindable({
			hue: 0,
			saturation: 0,
			brightness: 0,
			hex: '#000000'
		})
	}: Props = $props();

	let { hue, saturation, brightness, hex } = $state(color);

	export const setColorFromHex = (hex: string) => {
		const { red, green, blue } = parseHex(hex);
		[hue, saturation, brightness] = RGBToHSB(red, green, blue);
	};

	run(() => {
		color = {
			hue,
			saturation,
			brightness,
			hex
		};
		color = color;
	});

	run(() => {
		hex = HSBToRGB(hue, saturation, brightness)
			.map((c) => Math.round(c).toString(16).padStart(2, '0'))
			.join('');
	});

	let hueMouseDown = $state(false);
	let pickerMouseDown = $state(false);
	run(() => {
		if (browser) {
			if (pickerMouseDown || hueMouseDown) {
				document.body.classList.add('noselect', 'overflow-y-hidden', 'h-full');
			} else {
				document.body.classList.remove('noselect', 'overflow-y-hidden', 'h-full');
			}
		}
	});

	let hueFocus = $state(false);
	let pickerFocus = $state(false);

	let huePicker: HTMLDivElement = $state();
	let colorPicker: HTMLDivElement = $state();

	// 16 is the content width of the picker circle
	let huePickerWidth = $derived(huePicker?.getBoundingClientRect()?.width - 16 ?? 0);
	// 8 is half of 16, the content width of the picker circle
	let huePickerOffset = $derived(huePicker?.getBoundingClientRect()?.x + 8 ?? 0);
	let huePickerX = $derived((hue / 360) * huePickerWidth);
	function setHueFromMousePos(x: number) {
		hue = Math.round(
			(Math.min(Math.max(0, x - huePickerOffset), huePickerWidth) / huePickerWidth) * 360
		);
	}

	let colorPickerWidth = $derived(colorPicker?.getBoundingClientRect()?.width - 16 ?? 0);
	let colorPickerHeight = $derived(colorPicker?.getBoundingClientRect()?.height - 16 ?? 0);
	let colorPickerOffsetX = $derived(colorPicker?.getBoundingClientRect()?.x + 8 ?? 0);
	let colorPickerOffsetY = $derived(colorPicker?.getBoundingClientRect()?.y + 8 ?? 0);
	let colorPickerX = $derived((saturation / 100) * colorPickerWidth);
	let colorPickerY = $derived(((100 - brightness) / 100) * colorPickerHeight);
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
	onpointerup={(e) => {
		e.preventDefault();
		hueMouseDown = false;
		pickerMouseDown = false;
	}}
	onpointermove={(e) => {
		e.preventDefault();
		if (hueMouseDown) {
			setHueFromMousePos(e.pageX);
		}
		if (pickerMouseDown) {
			setColorFromMousePos(e.pageX, e.pageY);
		}
	}}
	onkeydown={(e) => {
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
		onpointerdown={(e) => {
			e.preventDefault();
			pickerMouseDown = true;
		}}
		onclick={(e) => {
			setColorFromMousePos(e.pageX, e.pageY);
		}}
	>
		{#if contrastRatio > 0}
			<ColorPickerContrastLine {hue} {contrastRatio} {against} />
		{/if}
		<div
			onfocus={() => (pickerFocus = true)}
			onblur={() => (pickerFocus = false)}
			tabindex="0"
			class="absolute rounded-full w-4 h-4 ring-gray-400 ring-offset-white ring-1 ring-offset-4 transform translate-0 outline-none focus:ring-blue-500"
			style="--tw-translate-x: {colorPickerX}px; --tw-translate-y: {colorPickerY}px;"
		></div>
	</div>
	<div
		class="w-full h-4 relative hue-picker rounded-full"
		bind:this={huePicker}
		onpointerdown={(e) => {
			e.preventDefault();
			hueMouseDown = true;
		}}
		onclick={(e) => {
			setHueFromMousePos(e.pageX);
		}}
	>
		<div
			onfocus={() => (hueFocus = true)}
			onblur={() => (hueFocus = false)}
			tabindex="0"
			class="absolute rounded-full w-4 h-4 ring-gray-400 ring-offset-white ring-1 ring-offset-4 transform translate-0 outline-none focus:ring-blue-500"
			style="--tw-translate-x: {huePickerX}px;"
		></div>
	</div>
</div>

<style>
	div.color-picker {
		--hue: 0;
		background:
			linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%) repeat scroll 0% 0%,
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
