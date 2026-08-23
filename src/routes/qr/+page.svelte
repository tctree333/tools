<script module lang="ts">
	export const metadata = {
		title: 'QR Code Generator',
		description: 'Generate QR codes.'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import QRCode, { type QRCodeErrorCorrectionLevel } from 'qrcode';

	let value = $state('hello world');
	let errorCorrectionLevel: QRCodeErrorCorrectionLevel = $state('Q');
	let scale = $state(4);
	let dark = $state('#000000ff');
	let light = $state('#ffffffff');

	let dataUrl: string | null = $state(null);
	$effect(() => {
		if (value) {
			QRCode.toDataURL(value, { errorCorrectionLevel, scale, color: { dark, light } })
				.then((url) => {
					dataUrl = url;
				})
				.catch((err) => {
					console.error(err);
					dataUrl = null;
				});
		} else {
			dataUrl = null;
		}
	});
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>QR Code Generator</h1>

<div class="flex flex-wrap gap-12 py-12 flex-col md:flex-row">
	<div class="flex-1 flex flex-col items-center">
		{#if dataUrl}
			<div class="flex-1 grid place-items-center">
				<img src={dataUrl} alt="QR Code" />
			</div>
			<a href={dataUrl} download="qrcode.png">Download QR Code</a>
		{:else}
			<p class="mb-4">Enter text to generate a QR code.</p>
		{/if}
	</div>
	<div class="flex-1">
		<textarea bind:value class="block w-full mb-4" rows="4"></textarea>

		<div class="flex flex-wrap gap-4">
			<div>
				<label>Scale: <input type="number" bind:value={scale} min="1" max="10" /></label>
			</div>
			<div>
				<label>Dark: <input type="color" bind:value={dark} /></label>
			</div>
			<div>
				<label>Light: <input type="color" bind:value={light} /></label>
			</div>
			<label>
				Error Correction Level:
				<select bind:value={errorCorrectionLevel}>
					<option value="L">Low</option>
					<option value="M">Medium</option>
					<option value="Q">Quartile</option>
					<option value="H">High</option>
				</select>
			</label>
		</div>
	</div>
</div>
