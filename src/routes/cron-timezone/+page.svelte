<script context="module" lang="ts">
	throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

	// export const metadata = {
	// 	title: 'Cron Timezone Shifter',
	// 	description: 'Convert crontab syntax from one timezone to another.'
	// };
</script>

<script lang="ts">
	import Head from '$lib/components/Head.svelte';

	import parser from 'cron-parser';

	let cron = '6 */4 * * 1-5';
	let offset = -7;
	$: offset = offset && Math.max(Math.min(offset, 14), -14);
	$: readableOffset =
		offset === 0
			? 'Keep Original'
			: `${offset > 0 ? 'add' : 'subtract'} ${Math.floor(Math.abs(offset))} hours ${Math.round(
					(Math.abs(offset) - Math.floor(Math.abs(offset))) * 60
			  )} minutes`;

	$: result = calculateShift(cron, offset);

	type EditableField = {
		-readonly [K in keyof parser.CronFields]: [...parser.CronFields[K]];
	};

	function calculateShift(original: string, shift: number) {
		if (shift === 0) {
			return [original];
		}
		const sign = shift > 0 ? 1 : -1;
		const shiftHours = sign * Math.floor(Math.abs(shift));
		const shiftMinutes = sign * Math.round((Math.abs(shift) - Math.floor(Math.abs(shift))) * 60);

		let originalFields: parser.CronFields;
		try {
			originalFields = parser.parseExpression(original).fields;
		} catch {
			return [];
		}

		const outputFields: EditableField[] = [];
		handleMinutes();

		return outputFields.flatMap((field) => {
			try {
				return [parser.fieldsToExpression(field as parser.CronFields).stringify()];
			} catch {}
			return [];
		});

		function handleMinutes(): void {
			const newFields: EditableField[] = [];

			let carryMinute: -1 | 1;
			originalFields.minute.forEach((minute) => {
				const shifted = minute + shiftMinutes;
				const carry = shifted < 0 ? -1 : shifted >= 60 ? 1 : 0;
				if (carry !== 0) carryMinute = carry;

				// take modulo (prevent negatives)
				const newMinute = (((shifted % 60) + 60) % 60) as parser.SixtyRange;

				const index = carry === 0 ? 0 : 1;
				if (newFields[index] !== undefined) {
					newFields[index].minute.push(newMinute);
				} else {
					newFields[index] = {
						second: [0],
						minute: [newMinute],
						hour: [],
						dayOfMonth: [],
						month: [],
						dayOfWeek: []
					};
				}
			});

			if (newFields[0]) {
				handleHour(newFields[0]);
			}
			if (newFields[1]) {
				handleHour(newFields[1], carryMinute);
			}
		}

		function handleHour(field: parser.CronFields, carryMinute?: -1 | 1): void {
			if (field.minute.length === 0) return;

			const newFields: EditableField[] = [];

			let carryHour: -1 | 1;
			originalFields.hour.forEach((hour) => {
				const shifted = hour + shiftHours + (carryMinute ?? 0);
				const carry = shifted < 0 ? -1 : shifted >= 24 ? 1 : 0;
				if (carry !== 0) carryHour = carry;

				// take modulo (prevent negatives)
				const newHour = (((shifted % 24) + 24) % 24) as parser.HourRange;

				const index = carry === 0 ? 0 : 1;
				if (newFields[index] === undefined) {
					// deep copy
					newFields[index] = JSON.parse(JSON.stringify(field));
				}
				newFields[index].hour.push(newHour);
			});

			if (newFields[0]) {
				handleDay(newFields[0]);
			}
			if (newFields[1]) {
				handleDay(newFields[1], carryHour);
			}
		}

		function handleDay(field: parser.CronFields, carryHour?: -1 | 1): void {
			// for simplicity, we won't carry to months
			if (field.hour.length === 0) return;

			const newField: EditableField = JSON.parse(JSON.stringify(field));

			originalFields.dayOfMonth.forEach((dayOfMonth) => {
				if (dayOfMonth === 'L') return;

				const shifted = dayOfMonth + (carryHour ?? 0);
				// this isn't technically correct because it doesn't take
				// into account the month, but i don't care
				const newDay = (
					shifted === 0 ? 31 : shifted === 32 ? 1 : shifted
				) as parser.DayOfTheMonthRange;

				newField.dayOfMonth.push(newDay);
			});

			originalFields.dayOfWeek.forEach((dayOfWeek) => {
				const shifted = dayOfWeek + (carryHour ?? 0);
				// again, there could be issues with month rollover but oh weell
				const newDay = (
					shifted === -1 ? 6 : shifted === 8 ? 1 : shifted
				) as parser.DayOfTheWeekRange;

				if (!newField.dayOfWeek.includes(newDay)) {
					newField.dayOfWeek.push(newDay);
				}
			});

			newField.month = [...originalFields.month];

			outputFields.push(newField);
		}
	}
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>Cron Timezone Shifter</h1>

<p>
	If you need to run something on a cron schedule but as a different timezone, it can be difficult
	to figure out how to write a schedule that will give you the results you want. For example, <a
		href="https://github.com/features/actions">GitHub Actions</a
	> allows cron symtax for scheduled actions, but uses the UTC timezone. This means that your tasks may
	be running at unexpected times!
</p>
<p>
	<strong>Limitations:</strong> This tool does not take month rollovers into account, so it may not
	give correct results if your original cron runs close to the edge of a month. This may also appear
	when using the month and day of week fields together.
	<br />
	Using 'L' to represent the last day of the month is not supported.
</p>

<label class="block mb-4 mt-10">
	<span class="font-medium text-stone-900">Original Cron:</span>
	<input bind:value={cron} type="text" />
</label>

<label class="mr-2">
	<span class="font-medium text-stone-900">Shift by (hours):</span>
	<input bind:value={offset} type="number" class="w-20" max="14" min="-14" />
</label>
<p class="inline whitespace-nowrap">({readableOffset})</p>
<p class="!mt-2 text-sm">
	Note: If you're converting TO UTC, the shift will be the inverse of your UTC offset.<br />For
	example, converting from UTC-7 to UTC will be a shift of plus 7.
</p>

<p class="!-mb-2"><strong>Output:</strong></p>
<ul>
	{#each result as r}
		<li><code>{r}</code></li>
	{/each}
</ul>
