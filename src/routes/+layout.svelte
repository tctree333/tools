<script>
	import '../app.css';
</script>

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
