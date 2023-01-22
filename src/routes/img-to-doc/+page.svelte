<script context="module" lang="ts">
	export const metadata = {
		title: 'Image to Document',
		description: 'Convert images of documents to a scan-like PDF.'
	};
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';
	import { Image } from 'image-js';
	import * as zip from '@zip.js/zip.js';
	import { jsPDF } from 'jspdf';

	const UNICORN =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Cpath fill='%23C1CDD5' d='M36 19.854C33.518 9.923 25.006 1.909 16.031 6.832c0 0-4.522-1.496-5.174-1.948-.635-.44-1.635-.904-.912.436.423.782.875 1.672 2.403 3.317C8 12.958 9.279 18.262 7.743 21.75c-1.304 2.962-2.577 4.733-1.31 6.976 1.317 2.33 4.729 3.462 7.018 1.06 1.244-1.307.471-1.937 3.132-4.202 2.723-.543 4.394-1.791 4.394-4.375 0 0 .795-.382 1.826 6.009.456 2.818-.157 5.632-.039 8.783H36V19.854z'/%3E%3Cpath fill='%2360379A' d='M31.906 6.062c.531 1.312.848 3.71.595 5.318-.15-3.923-3.188-6.581-4.376-7.193-2.202-1.137-4.372-.979-6.799-.772.111.168.403.814.32 1.547-.479-.875-1.604-1.42-2.333-1.271-1.36.277-2.561.677-3.475 1.156-.504.102-1.249.413-2.372 1.101-1.911 1.171-4.175 4.338-6.737 3.511 1.042 2.5 3.631 1.845 3.631 1.845 1.207-1.95 4.067-3.779 6.168-4.452 7.619-1.745 12.614 3.439 15.431 9.398.768 1.625 2.611 7.132 4.041 10.292V10.956c-.749-1.038-1.281-3.018-4.094-4.894z'/%3E%3Cpath fill='%23C1CDD5' d='M13.789 3.662c.573.788 3.236.794 4.596 3.82 1.359 3.026-1.943 2.63-3.14 1.23-1.334-1.561-1.931-2.863-2.165-3.992-.124-.596-.451-2.649.709-1.058z'/%3E%3Cpath fill='%23758795' d='M14.209 4.962c.956.573 2.164 1.515 2.517 2.596.351 1.081-.707.891-1.349-.042-.641-.934-.94-1.975-1.285-2.263-.346-.289.117-.291.117-.291z'/%3E%3Ccircle fill='%23292F33' cx='15.255' cy='14.565' r='.946'/%3E%3Cpath fill='%2353626C' d='M8.63 26.877c.119.658-.181 1.263-.67 1.351-.49.089-.984-.372-1.104-1.03-.119-.659.182-1.265.671-1.354.49-.088.984.373 1.103 1.033z'/%3E%3Cpath fill='%23EE7C0E' d='M13.844 8.124l.003-.002-.005-.007-.016-.014c-.008-.007-.011-.019-.019-.025-.009-.007-.021-.011-.031-.018C12.621 7.078.933-.495.219.219-.51.948 10.443 9.742 11.149 10.28l.011.006.541.439c.008.007.01.018.018.024.013.01.028.015.042.024l.047.038-.009-.016c.565.361 1.427.114 1.979-.592.559-.715.577-1.625.066-2.079z'/%3E%3Cpath fill='%23C43512' d='M4.677 2.25l.009-.025c-.301-.174-.594-.341-.878-.5-.016.038-.022.069-.041.11-.112.243-.256.484-.429.716-.166.224-.349.424-.541.595-.02.018-.036.026-.056.043.238.22.489.446.745.676.234-.21.456-.449.654-.717.214-.287.395-.589.537-.898zm2.275 2.945c.306-.41.521-.822.66-1.212-.292-.181-.584-.36-.876-.538-.076.298-.247.699-.586 1.152-.31.417-.613.681-.864.845.259.223.52.445.779.665.314-.244.619-.552.887-.912zM9.87 7.32c.365-.49.609-.983.734-1.437l-.906-.586c-.023.296-.172.81-.631 1.425-.412.554-.821.847-1.1.978l.814.671c.381-.256.761-.611 1.089-1.051z'/%3E%3C/svg%3E";

	let files: FileList;
	let imageUri: string;
	let image: Image;
	let converted: { uri: string; width: number; height: number };

	let savedImgs: { uri: string; width: number; height: number }[] = [];

	let points: [number, number][] = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0]
	];

	let threshold = 0.6;

	let loading = false;

	function loadFile() {
		loading = true;
		const file = files[0];
		const reader = new FileReader();
		reader.addEventListener('load', () => {
			Image.load(reader.result as string).then((res) => {
				image = res;
				imageUri = reader.result as string;
				let size = image.width * 0.05;
				points = [
					[size + 1, size + 1],
					[image.width - size, size],
					[image.width - size, image.height - size],
					[size, image.height - size + 1]
				];
				loading = false;
			});
		});
		reader.readAsDataURL(file);
	}

	function dragCorners(node: SVGSVGElement) {
		node.addEventListener('mousedown', startDrag);
		document.body.addEventListener('mousemove', drag);
		document.body.addEventListener('mouseup', endDrag);

		node.addEventListener('touchstart', startDrag);
		document.body.addEventListener('touchmove', drag);
		document.body.addEventListener('touchend', endDrag);
		document.body.addEventListener('touchcancel', endDrag);

		let element: HTMLElement;
		let offset: [number, number];
		const bound = node.getBBox();

		function getMouse(ev: MouseEvent | TouchEvent) {
			const CTM = node.getScreenCTM();
			let touchOrMouse: MouseEvent | Touch;
			if ((ev as TouchEvent).touches != undefined) {
				touchOrMouse = (ev as TouchEvent).touches[0];
			} else {
				touchOrMouse = ev as MouseEvent;
			}
			let x = (touchOrMouse.clientX - CTM.e) / CTM.a;
			let y = (touchOrMouse.clientY - CTM.f) / CTM.d;
			return [x, y];
		}

		function startDrag(ev: MouseEvent) {
			if ((ev.target as HTMLElement).getAttribute('id')?.startsWith('point')) {
				element = ev.target as HTMLElement;
				const [x, y] = getMouse(ev);
				const id = parseInt(element.getAttribute('id').slice(-1));
				offset = [x - points[id][0], y - points[id][1]];
			}
		}

		function drag(ev: MouseEvent) {
			if (element) {
				ev.preventDefault();
				let [x, y] = getMouse(ev);
				x -= offset[0];
				y -= offset[1];
				x = Math.max(0, Math.min(x, bound.width));
				y = Math.max(0, Math.min(y, bound.height));

				const id = parseInt(element.getAttribute('id').slice(-1));
				points[id] = [x, y];
			}
		}
		function endDrag() {
			element = null;
		}
	}

	function convert() {
		const newImage = image.warpingFourPoints(points).grey().mask({ threshold });
		return {
			uri: newImage.toDataURL(),
			width: newImage.width,
			height: newImage.height
		};
	}

	function saveToPdf() {
		const docWidth = 850;
		const docHeight = 1100;
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'px',
			format: [docWidth, docHeight]
		});
		doc.deletePage(1);
		doc.setDocumentProperties({
			author: '',
			creator: ''
		});
		savedImgs.forEach(({ uri, width, height }) => {
			const format = uri.split(';')[0].split('/')[1].toUpperCase();
			let newWidth = 0;
			let newHeight = 0;
			let x = 0;
			let y = 0;
			if (width >= height) {
				newWidth = docWidth;
				newHeight = height * (docWidth / width);
				x = 0;
				y = (docHeight - newHeight) / 2;
			} else {
				newHeight = docHeight;
				newWidth = width * (docHeight / height);
				x = (docWidth - newWidth) / 2;
				y = 0;
			}
			console.log({ width, height, newWidth, newHeight, x, y });
			doc.addPage();
			doc.addImage(uri, format, x, y, newWidth, newHeight);
		});
		doc.save('converted.pdf');
	}

	async function saveToImg() {
		const outWriter = new zip.BlobWriter('application/zip');
		const writer = new zip.ZipWriter(outWriter);

		await Promise.all(
			savedImgs.map(async ({ uri }, i) => {
				const ext = uri.split(';')[0].split('/')[1];
				await writer.add(`image${i}.${ext}`, new zip.Data64URIReader(uri));
			})
		);

		await writer.close();
		const blob = await outWriter.getData();
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = 'converted.zip';
		a.click();

		URL.revokeObjectURL(url);
	}
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Image to Document</h1>

<p>
	This tool will resize and mask any JPEG/PNG image of a document and export it to a PDF. This is
	all done locally in your browser, so no images or documents are sent to an external server.
</p>
<p>
	Note: Converting the image may take a while, and your browser may be unresponsive. Be patient and
	it should eventually finish.
</p>

<div
	class="p-6 my-12 text-black bg-purple-300 border-4 border-purple-600 border-dashed rounded-md spill dark:bg-purple-700 dark:text-white"
>
	{#if imageUri}
		<div class="flex flex-row flex-wrap gap-8 not-prose">
			<svg
				class="flex-1 basis-[420px] max-h-[720px]"
				viewBox="0 0 {image.width} {image.height}"
				use:dragCorners
			>
				<image href={imageUri} width={image.width} height={image.height} />
				<polygon
					points={points.map((p) => p.join(',')).join(' ')}
					fill="none"
					stroke="white"
					stroke-width={image.width * 0.005}
				/>
				<circle
					id="point0"
					cx={points[0][0]}
					cy={points[0][1]}
					r={image.width * 0.01}
					fill="white"
					stroke="white"
				/>
				<circle
					id="point1"
					cx={points[1][0]}
					cy={points[1][1]}
					r={image.width * 0.01}
					fill="white"
					stroke="white"
				/>
				<circle
					id="point2"
					cx={points[2][0]}
					cy={points[2][1]}
					r={image.width * 0.01}
					fill="white"
					stroke="white"
				/>
				<circle
					id="point3"
					cx={points[3][0]}
					cy={points[3][1]}
					r={image.width * 0.01}
					fill="white"
					stroke="white"
				/>
			</svg>
			<div class="flex-1 w-full basis-[420px] max-h-[720px] flex items-center justify-center">
				<img
					src={converted?.uri ?? UNICORN}
					alt="output"
					class="object-contain max-w-full max-h-full mx-auto"
				/>
			</div>
		</div>
		<div class="flex flex-row items-center justify-center w-full gap-4 mt-8">
			<button
				type="button"
				class="px-4 py-2 border-4 border-purple-600 rounded-md"
				on:click={() => {
					image = undefined;
					imageUri = undefined;
					converted = undefined;
				}}>Clear</button
			>
			<button
				type="button"
				class="flex flex-row items-center justify-center gap-2 px-4 py-2 border-4 border-purple-600 rounded-md"
				on:click={() => {
					document.getElementById('convert-spinner').classList.add('animate-spin');
					setTimeout(() => {
						converted = convert();
						document.getElementById('convert-spinner').classList.remove('animate-spin');
					}, 100);
				}}
				>Convert<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="w-6 h-6"
					id="convert-spinner"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg></button
			>
			<button
				type="button"
				class="px-4 py-2 border-4 border-purple-600 rounded-md"
				on:click={() => {
					savedImgs = [...savedImgs, converted];
					image = undefined;
					imageUri = undefined;
					converted = undefined;
				}}>Save</button
			>
		</div>
		<div class="flex items-center justify-center w-full mt-4">
			<label>
				Mask Threshold:
				<input
					type="number"
					min="0"
					max="1"
					step=".05"
					bind:value={threshold}
					class="w-24 border-4 border-purple-600 rounded-md"
				/>
			</label>
		</div>
	{:else if loading}
		<span class="flex flex-row items-center justify-center w-full">
			<p class="mr-4 font-medium">Loading...</p>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="w-6 h-6 animate-spin"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
				/>
			</svg>
		</span>
	{:else}
		<label>
			<span>Upload an image:</span>
			<input type="file" accept="image/png,image/jpeg" bind:files on:change={loadFile} />
		</label>
	{/if}
</div>

<div
	class="w-full p-6 text-black bg-green-300 border-4 border-green-600 border-dashed rounded-md spill not-prose dark:bg-green-700 dark:text-white"
>
	{#if savedImgs.length > 0}
		<div class="flex flex-row gap-6 overflow-x-scroll">
			{#each savedImgs as { uri }}
				<img src={uri} alt="output" class="h-[420px]" />
			{/each}
		</div>
		<div class="flex flex-row items-center justify-center w-full gap-4 mt-8">
			<button
				type="button"
				class="px-4 py-2 border-4 border-green-600 rounded-md "
				on:click={saveToPdf}>Save to PDF</button
			>
			<button
				type="button"
				class="px-4 py-2 border-4 border-green-600 rounded-md"
				on:click={saveToImg}>Save as image</button
			>
		</div>
	{:else}
		<p class="w-full text-center">No saved images yet!</p>
	{/if}
</div>

<style>
	.spill {
		width: calc(1280px - 4rem);
		margin-left: calc((100% - min(1280px, 100vw) + 4rem) / 2);
		max-width: calc(100vw - 4rem);
	}
	circle {
		cursor: move;
	}
</style>
