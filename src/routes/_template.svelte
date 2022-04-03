<script context="module" lang="ts">
	export const metadata = {
		title: 'Title Here',
		description: 'Description placeholder'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Wow!</h1>
