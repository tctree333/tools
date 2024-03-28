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

	let lastMessages: string[] = ['', '', '', '', ''];
	async function readLoop() {
		// Reads data from the input stream and displays it in the console.
		while (true) {
			const { value, done } = await reader.read();
			console.log('DEBUG', 'serial in', [value]);
			lastMessages.unshift(value);
			lastMessages.pop();

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
		const sentry = Math.random().toFixed(5).slice(2);
		const packet = `${data} ${sentry}\r\n`;
		console.log('DEBUG', 'serial out', [packet]);
		const writer = writerStream.getWriter();
		await writer.write(packet);
		writer.releaseLock();

		const returned = await new Promise<string>((resolve) =>
			setTimeout(() => {
				resolve(lastMessages.find((msg) => msg.trim().endsWith(sentry))?.split(' ')[0] ?? '');
			}, 100)
		);

		return returned;
	};

	let positions = new Map<string, number>();
	const move = async (motor: string, step: number) => {
		const newPos = await send(`${motor}${step > 0 ? '+' : '-'}${Math.abs(step)}`);

		if (isNaN(parseFloat(newPos))) return;

		positions.set(motor, parseFloat(newPos));
		positions = positions;
	};

	const handleKeypress = async (event: KeyboardEvent) => {
		if (!port) return;

		const key = event.key;
		if (key === 'q') {
			move('s', 5);
		} else if (key === 'a') {
			move('s', -5);
		} else if (key === 'w') {
			move('0', 5);
		} else if (key === 's') {
			move('0', -5);
		} else if (key === 'e') {
			move('1', 5);
		} else if (key === 'd') {
			move('1', -5);
		} else if (key === 'r') {
			move('2', 5);
		} else if (key === 'f') {
			move('2', -5);
		}
	};
</script>

<Head title={metadata.title} description={metadata.description} />

<svelte:window on:keypress={handleKeypress} />

<h1>Robot Arm</h1>

{#if serialSupported}
	<button on:click={connect} type="button" class="px-4 py-0.5 border-2 border-stone-400"
		>Connect</button
	>
	<button on:click={reset} type="button" class="px-4 py-0.5 border-2 border-stone-400">Reset</button
	>
	<div class="flex flex-row space-x-6">
		{#each ['s', '0', '1', '2'] as motor}
			<div class="flex flex-col space-y-4 items-center">
				<span>Motor {motor}:</span>
				<button
					on:click={() => move(motor, 5)}
					type="button"
					class="m-0 px-4 py-0.5 border-2 border-stone-400">+</button
				>
				<span>{positions.get(motor) ?? 0}</span>
				<button
					on:click={() => move(motor, -5)}
					type="button"
					class="m-0 px-4 py-0.5 border-2 border-stone-400">-</button
				>
			</div>
		{/each}
	</div>
{:else}
	<p>Your browser does not support web serial.</p>
{/if}
