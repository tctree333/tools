<script lang="ts" context="module">
	export const parseHex = (hex: string) => {
		const parts = hex.match(/[\da-f]/gi).length;
		if (!parts) {
			return;
		}

		if (parts === 6) {
			var [r, g, b] = hex.match(/[\da-f]{2}/gi)?.map((c) => parseInt(c, 16)) ?? [];
		} else if (parts === 3) {
			var [r, g, b] = hex.match(/[\da-f]/gi)?.map((c) => parseInt(c, 16)) ?? [];
		}
		return { red: r, green: g, blue: b };
	};

	export const HSBToRGB = (h: number, s: number, b: number) => {
		// convert HSB to RGB
		// hue is in [0, 360], saturation and brightness in [0, 100]
		s /= 100;
		b /= 100;
		const k = (n: number) => (n + h / 60) % 6;
		const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
		return [255 * f(5), 255 * f(3), 255 * f(1)];
	};

	export const contrastBetween = (
		first: { red: number; green: number; blue: number },
		second: { red: number; green: number; blue: number }
	) => {
		// an implementation of the WCAG color contrast algorithm
		// RGB values are [0, 255]
		const modifier = (color: number) => {
			if (color <= 0.03928) {
				return color / 12.92;
			} else {
				return Math.pow((color + 0.055) / 1.055, 2.4);
			}
		};
		const luminance = (color: { red: number; green: number; blue: number }) => {
			return (
				0.2126 * modifier(color.red / 255) +
				0.7152 * modifier(color.green / 255) +
				0.0722 * modifier(color.blue / 255)
			);
		};

		const firstLuminance = luminance(first);
		const secondLuminance = luminance(second);

		if (firstLuminance > secondLuminance) {
			return (firstLuminance + 0.05) / (secondLuminance + 0.05);
		} else {
			return (secondLuminance + 0.05) / (firstLuminance + 0.05);
		}
	};
</script>

<script lang="ts">
	export let hue: number;
	export let contrastRatio: number;
	export let against: string;

	let paths: string[] = [];

	$: {
		let points = findPoints(hue, against, contrastRatio);
		if (points[1].length !== 0) {
			paths = [generatePath(points[0]), generatePath(points[1])];
		} else {
			paths = [generatePath(points[0])];
		}
	}

	const findPoints = (selectedHue: number, against: string, contrastRatio: number) => {
		const againstColor = parseHex(against);

		const points: [number, number][][] = [[], []];

		// find points through brute force ish
		// the step/range numbers were determined through trial/error ish,
		// but the y value ranges need to be sufficently large to have the line touch the edges
		for (let x = -2; x <= 102; x += 13) {
			let prev: {
				y: number;
				pass: boolean;
			};
			let found: [number, number][] = [];
			for (let y = -5; y <= 115; y += 0.08) {
				const color = HSBToRGB(selectedHue, x, y);
				const contrast = contrastBetween(
					{ red: color[0], green: color[1], blue: color[2] },
					againstColor
				);
				const pass = contrast >= contrastRatio;

				if (prev) {
					if (prev.pass !== pass) {
						found.push([x, (prev.y + y) / 2]);
					}
				}

				prev = { y, pass };
			}

			if (found.length === 0) {
				continue;
			}

			// if there are two lines, we split by top/bottom points if they exist,
			// otherwise we find the line that's closest to the current point
			// this assumes that the line(s) will always intersect at saturation=0

			if (found.length > 1) {
				// multiple points found, split by top/bottom
				points[0].push(found[0]);
				points[1].push(found[1]);
				continue;
			}

			if (points[1].length === 0) {
				// no second line, just add the point
				points[0].push(found[0]);
			} else {
				// second line exists, find the line with the closest last point
				const [x, y] = found[0];
				const dist1 = Math.sqrt(
					Math.pow(points[0][points[0].length - 1][0] - x, 2) +
						Math.pow(points[0][points[0].length - 1][1] - y, 2)
				);
				const dist2 = Math.sqrt(
					Math.pow(points[1][points[1].length - 1][0] - x, 2) +
						Math.pow(points[1][points[1].length - 1][1] - y, 2)
				);

				if (dist1 < dist2) {
					points[0].push([x, y]);
				} else {
					points[1].push([x, y]);
				}
			}
		}
		return points;
	};

	const generatePath = (points: [number, number][]) => {
		const line = (a: [number, number], b: [number, number]) => {
			const x = b[0] - a[0];
			const y = b[1] - a[1];

			return {
				length: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
				angle: Math.atan2(y, x)
			};
		};
		const controlPoint = (
			current: [number, number],
			previous: [number, number],
			next: [number, number],
			reverse = false
		) => {
			const p = previous || current;
			const n = next || current;

			const smoothing = 0.2;
			const o = line(p, n);
			const angle = o.angle + (reverse ? Math.PI : 0);
			const length = o.length * smoothing;
			return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
		};

		return points.reduce((acc, point, i, a) => {
			if (i === 0) {
				acc += `M ${point[0] - 1} ${100 - point[1]}`;
				return acc;
			}
			const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
			const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);

			acc += `C${cpsX},${100 - cpsY} ${cpeX},${100 - cpeY} ${point[0]},${100 - point[1]}`;
			// acc += `L ${point[0]},${100 - point[1]}`;
			return acc;
		}, '');
	};
</script>

<svg class="absolute inset-0" viewBox="0 0 100 100">
	{#each paths as path}
		<path d={path} fill="transparent" stroke="white" />
	{/each}
</svg>
