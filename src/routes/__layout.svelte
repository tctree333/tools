<script>
	import '../app.css';
</script>

<header class="border-b-2">
	<nav class="flex max-w-7xl mx-auto px-8 py-4">
		<a class="font-bold text-4xl" href="/">Tools</a>
	</nav>
</header>
<div class="flex-1">
	<main class="max-w-4xl mx-auto px-8 mt-8 mb-20 text-xl prose">
		<slot />
	</main>
</div>
<footer class="grid place-items-center py-12 px-8 bg-stone-100">
	<div>
		A web project by <a class="underline" href="https://tomichen.com">Tomi Chen</a>.
	</div>
</footer>

<style>
	:global(body) {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}
</style>
