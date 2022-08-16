<script context="module" lang="ts">
	throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

	// export const metadata = {
	// 	title: 'Diceware Passphrases',
	// 	description: 'Generate a diceware passphrase.'
	// };
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import long from '$lib/data/eff-wordlist-long';
	import short1 from '$lib/data/eff-wordlist-short1';
	import short2 from '$lib/data/eff-wordlist-short2';

	const wordlists = {
		long: {
			list: long,
			numbers: 5,
			words: 7776
		},
		short1: {
			list: short1,
			numbers: 4,
			words: 1296
		},
		short2: {
			list: short2,
			numbers: 4,
			words: 1296
		}
	};

	let generated = '';
	let length = 6;
	let selectedList = 'long';

	$: {
		generated = generate(length, selectedList);
	}

	function generate(count: number, list: string) {
		const config = wordlists[list];

		const phrase: string[] = [];
		const array = new Uint8Array(config.numbers);
		for (let i = 0; i < count; i++) {
			crypto.getRandomValues(array);
			const key = array.map((x) => Math.floor((x / 255) * 6) + 1).join('');
			phrase.push(config.list[key]);
		}
		return phrase.join(' ');
	}
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Diceware Passphrases</h1>

<p class="text-4xl text-center w-full border-2 p-14">{generated}</p>

<div class="flex flex-row items-center space-x-2">
	<label>
		Number of Words:
		<input bind:value={length} type="number" class="border-2 border-stone-400" />
	</label>
	<label>
		<select bind:value={selectedList} class="border-2 border-stone-400">
			<option value="long">Long Wordlist</option>
			<option value="short1">Short Wordlist 1</option>
			<option value="short2">Short Wordlist 2</option>
		</select>
	</label>
	<button
		on:click={() => {
			generated = generate(length, selectedList);
		}}
		type="button"
		class="px-4 py-0.5 border-2 border-stone-400">Again!</button
	>
</div>

<p>
	This passphrase generator uses the <a href="https://en.wikipedia.org/wiki/Diceware"
		>diceware method</a
	>
	along with <a href="https://www.eff.org/dice">EFF's wordlists</a> to generate secure passphrases that
	are easier to remember. A 6 word passphrase is generally reccommended.
</p>
<p>
	The "Long Wordlist" contains 7,776 words, while the short wordlists contain 1,296 words each.
	"Short Wordlist 1" has shorter words, and "Short Wordlist 2" has longer words.
</p>
<p>
	This site uses the <a
		href="https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues"
	>
		Web Crypto API</a
	> to generate random numbers. All computation is done on-device.
</p>
