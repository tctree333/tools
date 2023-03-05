<script>
	import '../app.css';

	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';

	let ReloadPrompt;
	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({
				immediate: true,
				onRegistered(r) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				}
			});

			ReloadPrompt = (await import('$lib/ReloadPrompt.svelte')).default;
		}
	});

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<header class="border-b-2 border-blue-100">
	<nav class="max-w-7xl mx-auto px-8 py-4 text-stone-900 dark:text-stone-50">
		<a class="font-medium text-3xl flex flex-row items-center max-w-fit" href="/"
			><img src="/logo.svg" alt="logo" class="h-10 w-10 inline mr-2" />Tools</a
		>
	</nav>
</header>
<div class="flex-1">
	<main
		class="max-w-5xl mx-auto px-8 mt-8 mb-20 prose prose-stone sm:prose-lg md:prose-xl dark:prose-invert"
	>
		<slot />
	</main>
</div>
<footer
	class="grid place-items-center py-12 px-8 bg-lime-50 border-t-2 border-lime-600 dark:bg-lime-900 dark:text-stone-200"
>
	<div>
		A web project by <a class="underline" href="https://tomichen.com">Tomi Chen</a>.
	</div>
</footer>

{#if ReloadPrompt}
	<svelte:component this={ReloadPrompt} />
{/if}s
