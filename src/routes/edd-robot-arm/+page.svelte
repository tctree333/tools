<script context="module" lang="ts">
	export const metadata = {
		title: 'Robot Arm',
		description: 'Control a robotic arm over Web Serial.'
	};
</script>

<script lang="ts">
	import { browser } from '$app/environment';

	import Head from '$lib/components/Head.svelte';

	let serialSupported = browser && 'serial' in navigator;

	let port: SerialPort;

	const writeEncoder = new TextEncoderStream();
	let writerStream: WritableStream<string>;
	const textDecoder = new TextDecoderStream();
	let reader: ReadableStreamDefaultReader<string>;

	const connect = async () => {
		port = await navigator.serial.requestPort();
		await port.open({ baudRate: 115200 });

		writeEncoder.readable.pipeTo(port.writable);
		writerStream = writeEncoder.writable;

		port.readable.pipeTo(textDecoder.writable);
		reader = textDecoder.readable.getReader();

		readLoop();
		reset();
	};

	let lastMessage: string = '';
	async function readLoop() {
		// Reads data from the input stream and displays it in the console.
		while (true) {
			const { value, done } = await reader.read();
			console.log('DEBUG', 'serial in', [value]);
			lastMessage = value;

			if (done) {
				console.log('[readLoop] DONE', done);
				reader.releaseLock();
				break;
			}
		}
	}

	async function reset() {
		console.log('reset');
		const writer = writerStream.getWriter();
		await writer.write('\x03');
		await writer.write('\x04');
		writer.releaseLock();
	}

	const send = async (data: string): Promise<string> => {
		console.log(data);
		const writer = writerStream.getWriter();
		await writer.write(data + '\x0D');
		writer.releaseLock();

		return lastMessage;
	};

	let positions = new Map<string, number>();
	const move = async (motor: string, step: number) => {
		const newPos = await send(`${motor}${step > 0 ? '+' : '-'}${Math.abs(step)}\n`);
		positions.set(motor, parseFloat(newPos));
		positions = positions;
	};
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Robot Arm</h1>

{#if serialSupported}
	<button on:click={connect} type="button" class="px-4 py-0.5 border-2 border-stone-400"
		>Connect</button
	>
	<button on:click={reset} type="button" class="px-4 py-0.5 border-2 border-stone-400">Reset</button
	>
	<div class="flex flex-row space-x-6">
		{#each ['s', '0', '1', '2'] as motor}
			<div class="flex flex-col space-y-4">
				<button
					on:click={() => move(motor, 5)}
					type="button"
					class="px-4 py-0.5 border-2 border-stone-400">+</button
				>
				{positions.get(motor) ?? 0}
				<button
					on:click={() => move(motor, -5)}
					type="button"
					class="px-4 py-0.5 border-2 border-stone-400">-</button
				>
			</div>
		{/each}
	</div>
{:else}
	<p>Your browser does not support web serial.</p>
{/if}
