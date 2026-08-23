<script module lang="ts">
	export const metadata = {
		title: 'QR Code Generator',
		description: 'Generate QR codes.'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	let value = $state('');
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>QR Code Generator</h1>
<textarea bind:value class="block w-full mb-4" rows="4"></textarea>
