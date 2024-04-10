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
		if (!browser) return;

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
			if (!reader) continue;

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
		if (!writerStream) return;

		console.log('reset');
		const writer = writerStream.getWriter();
		await writer.write('\x03');
		await writer.write('\x04');
		writer.releaseLock();
	}

	const send = async (data: string): Promise<string> => {
		if (!writerStream) return;

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
	positions.set('s', 0);
	const move = async (motor: string, step: number) => {
		const newPos = await send(`${motor}${step > 0 ? '+' : '-'}${Math.abs(step)}`);

		if (isNaN(parseFloat(newPos))) return;

		positions.set(motor, parseFloat(newPos));
		positions = positions;
	};
	const set = async (motor: string, angle: number) => {
		const newPos = await send(`${motor}s${angle}`);

		if (isNaN(parseFloat(newPos))) return;

		positions.set(motor, parseFloat(newPos));
		positions = positions;
	};

	const handleKeypress = async (event: KeyboardEvent) => {
		if (!port) return;

		const key = event.key;
		// if (key === 'q') {
		// 	move('s', 5);
		// } else if (key === 'a') {
		// 	move('s', -5);
		// } else if (key === 'w') {
		// 	move('0', 5);
		// } else if (key === 's') {
		// 	move('0', -5);
		// } else if (key === 'e') {
		// 	move('1', 5);
		// } else if (key === 'd') {
		// 	move('1', -5);
		// } else if (key === 'r') {
		// 	move('2', 5);
		// } else if (key === 'f') {
		// 	move('2', -5);
		// }

		if (key === 'w') {
			target[1] += 1;
		} else if (key === 's') {
			target[1] -= 1;
		} else if (key === 'd') {
			target[0] += 1;
		} else if (key === 'a') {
			target[0] -= 1;
		} else if (key === 'e') {
			target[2] += 1;
		} else if (key === 'q') {
			target[2] -= 1;
		}
		target = target;
	};

	// attempt at inverse kinematics based on FABRIK
	// References:
	// http://www.andreasaristidou.com/FABRIK.html
	// https://sean.cm/a/fabrik-algorithm-2d/

	type Point3D = [number, number, number];
	type Point2D = [number, number];

	let target: Point3D = [0, 14, 7];
	let jointAngles = [90, 90, 90];
	const armLength = 10;
	$: jointAngles = moveArm(target, jointAngles);

	const pythag = (x: number, y: number): number => {
		return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	};

	const STEPS_PER_REV = 200;
	const extractTargetPos = (target: Point3D): [number, Point2D] => {
		const radians = Math.atan2(target[1], target[0]) - Math.PI / 2;
		const radius = pythag(target[0], target[1]);
		return [radians * (STEPS_PER_REV / 2 / Math.PI), [radius, target[2]]];
	};

	const extractPlaneCoordinates = (jointAngles: number[]): Point2D[] => {
		return [90]
			.concat(...jointAngles)
			.slice(0, -1)
			.reduce((acc, angle, i, arr) => {
				if (i === 0) {
					acc.push([0, 0]);
				} else {
					const absoluteAngle = arr.slice(0, i + 1).reduce((acc, angle) => acc + angle - 90, 90);
					acc.push([
						acc[acc.length - 1][0] + Math.cos((absoluteAngle * Math.PI) / 180) * armLength,
						acc[acc.length - 1][1] + Math.sin((absoluteAngle * Math.PI) / 180) * armLength
					]);
				}
				return acc;
			}, [] as Point2D[]);
	};

	const fabrik = (target: Point2D, jointCoords: Point2D[]) => {
		const reach = (tail: Point2D, target: Point2D): Point2D => {
			const sdX = tail[0] - target[0];
			const sdY = tail[1] - target[1];
			const stretchedDist = pythag(sdX, sdY);

			const scale = armLength / stretchedDist;
			return [target[0] + scale * sdX, target[1] + scale * sdY];
		};

		const forwardReach = jointCoords.reverse().reduce(
			(acc, _, i, arr) => {
				acc.newJoints.unshift(acc.target);
				if (i !== arr.length - 1) {
					acc.target = reach(arr[i + 1], acc.target);
				}
				return acc;
			},
			{ target, newJoints: [] as Point2D[] }
		);

		const backwardReach = forwardReach.newJoints.reduce(
			(acc, _, i, arr) => {
				acc.newJoints.push(acc.target);
				if (i !== arr.length - 1) {
					acc.target = reach(arr[i + 1], acc.target);
				}
				return acc;
			},
			{ target: [0, 0] as Point2D, newJoints: [] as Point2D[] }
		).newJoints;

		return backwardReach;
	};

	const computeJointAngles = (jointCoords: Point2D[]): number[] => {
		jointCoords.push([
			jointCoords[jointCoords.length - 1][0] * 1.1,
			jointCoords[jointCoords.length - 1][1]
		]);
		return jointCoords.reduce((acc, joint, i, arr) => {
			if (i === 0) return acc;
			const prevPoint = arr[i - 1];
			const dX = joint[0] - prevPoint[0];
			const dY = joint[1] - prevPoint[1];
			const absoluteAngle = (Math.atan2(dY, dX) * 180) / Math.PI;
			const relativeAngle = absoluteAngle + 90 - acc.reduce((acc, angle) => acc + angle - 90, 90);
			acc.push(relativeAngle);
			return acc;
		}, []);
	};

	const moveArm = (target: Point3D, jointAngles: number[]) => {
		const [targetAngle, targetCoord] = extractTargetPos(target);
		const jointCoords = extractPlaneCoordinates(jointAngles);
		const newJointCoords = fabrik(targetCoord, jointCoords);
		const newJointAngles = computeJointAngles(newJointCoords);
		console.log('DEBUG', 'moveArm', {
			target,
			jointAngles,
			targetAngle,
			targetCoord,
			jointCoords,
			newJointCoords,
			newJointAngles
		});

		newJointAngles.forEach((angle, i) => {
			set(i.toString(), angle);
		});
		positions.set('s', targetAngle - positions.get('s'));
		set('s', positions.get('s'));

		return newJointAngles;
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
	<details>
		<summary>Move Motors</summary>
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
	</details>

	<p>Desired Postition: {JSON.stringify(target)}</p>
	<p>Computed Joint Angles: {JSON.stringify(jointAngles)}</p>
	<p>Actual Angles: {JSON.stringify([...positions.values()], null, 2)}</p>
{:else}
	<p>Your browser does not support web serial.</p>
{/if}
