<script context="module" lang="ts">
	export const metadata = {
		title: 'SciOly Performance Tracker',
		description: 'Track individual performance using Duosmium data.'
	};
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import Head from '$lib/components/Head.svelte';
	import Interpreter from 'sciolyff/interpreter';
	import { onMount } from 'svelte';

	let schoolName = '';
	let tournamentString = '';
	let interpreters: { i: Interpreter; name: string }[] = [];

	let people: {
		[name: string]: {
			average: number;
			placings: { [tournament: string]: { team: string; events: [string, number][] } };
		};
	} = {};

	let sort: 'name' | 'avg' = 'name';

	$: browser && schoolName && localStorage.setItem('schoolName', schoolName);
	$: browser && tournamentString && localStorage.setItem('tournamentString', tournamentString);

	let colors: { [name: string]: string } = {};

	async function fetchInterpreters() {
		const tournaments = tournamentString
			.split('\n')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);

		interpreters = [];
		await Promise.all(
			tournaments.map(async (t) => {
				const resp = await fetch(`https://www.duosmium.org/data/${t}.yaml`);
				const text = await resp.text();
				const interpreter = new Interpreter(text);
				interpreters = [...interpreters, { i: interpreter, name: t }];
			})
		);
		interpreters = interpreters.sort((a, b) => a.name.localeCompare(b.name));
	}

	async function loadInterpreters() {
		await fetchInterpreters();
		interpreters.forEach(({ name }) => {
			const text = localStorage.getItem(name);
			if (text) {
				const target = document.getElementById(name) as HTMLTextAreaElement;
				target.value = text;
				updatePeople({ target } as unknown as Event);
			}
		});
	}

	function updatePeople(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const tournament = interpreters.find((i) => i.name === target.id);
		if (!tournament) return;

		localStorage.setItem(target.id, target.value);

		Object.values(people).forEach((p) => {
			delete p.placings[target.id];
		});

		target.value
			.split('\n')
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
			.forEach((p) => {
				const [student, teamName, ...events] = p
					.split(',')
					.map((s) => s.trim())
					.filter((s) => s.length > 0);

				const i = interpreters.find((i) => i.name === target.id)?.i;
				const team = i?.teams.find((t) => t.school === schoolName && t.suffix === teamName);

				if (!people[student]) people[student] = { average: -1, placings: {} };
				people[student].placings[target.id] = {
					team: teamName,
					events: events.map((eventName) => [
						eventName,
						team.placingFor(i.events.find((e) => e.name === eventName))?.isolatedPoints
					])
				};
			});

		calcPeople();
	}

	function calcPeople() {
		Object.entries(people).forEach(([name, { placings }]) => {
			const results = Object.values(placings).flatMap(({ events }) => events.map((e) => e[1]));
			people[name].average =
				Math.round((results.reduce((a, b) => a + b, 0) / results.length) * 100) / 100;
		});

		people = people;
	}

	function download() {
		// export inputs as json
		const data = interpreters.map(({ name }) => {
			const target = document.getElementById(name) as HTMLTextAreaElement;
			return { name, value: target.value };
		});
		const jsonString = JSON.stringify({
			schoolName,
			tournamentString,
			data
		});
		// download file
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonString));
		element.setAttribute('download', 'data.json');
		element.click();
		element.remove();
	}

	function loadData(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const data = JSON.parse(e.target?.result as string);
			schoolName = data.schoolName;
			tournamentString = data.tournamentString;
			loadInterpreters().then(() => {
				data.data.forEach(({ name, value }: { name: string; value: string }) => {
					const target = document.getElementById(name) as HTMLTextAreaElement;
					target.value = value;
					updatePeople({ target } as unknown as Event);
				});
			});
		};
		reader.readAsText(file);
	}

	onMount(() => {
		if (browser) {
			schoolName = localStorage.getItem('schoolName') || '';
			tournamentString = localStorage.getItem('tournamentString') || '';
			loadInterpreters();
		}

		fetch('https://www.duosmium.org/cache/bg-colors.json')
			.then((r) => r.json())
			.then((data) => {
				colors = data;
			});
	});
</script>

<Head title={metadata.title} description={metadata.description} />

<h1>SciOly Performance Tracker</h1>

<button class="px-4 py-0.5 border-2 border-stone-400 mb-4" on:click={download}
	>Download as JSON</button
>
<br />
<label>Load from JSON: <input type="file" on:change={loadData} accept=".json" /></label>

<h2>Step 1: Participated tournaments</h2>
<label class="block mb-4">School Name: <input type="text" bind:value={schoolName} /></label>
<textarea
	placeholder="2023-02-11_golden_gate_invitational_c ..."
	bind:value={tournamentString}
	on:change={loadInterpreters}
/>

<h2>Step 2: People and Events</h2>
{#each interpreters as { i, name }}
	<h3>
		<label>
			<input
				class="mr-2"
				id="{name}checkbox"
				type="checkbox"
				checked
				on:change={(e) => {
					if (!e.target.checked) {
						Object.values(people).forEach((p) => {
							delete p.placings[e.target.id.slice(0, -8)];
						});
						calcPeople();
					} else {
						updatePeople({ target: document.getElementById(e.target.id.slice(0, -8)) });
					}
				}}
			/>{i.tournament.name}
		</label>
	</h3>
	<textarea id={name} placeholder="Name,Team,Event 1,Event 2,..." on:change={updatePeople} />
{/each}

<h2>Step 3: Results</h2>
<button
	class="px-4 py-0.5 border-2 border-stone-400 mb-4"
	on:click={() => (sort = sort === 'name' ? 'avg' : 'name')}
	>Sort by {sort === 'name' ? 'average' : 'name'}</button
>
<table>
	<tbody>
		{#each Object.entries(people).sort( (a, b) => (sort === 'name' ? a[0].localeCompare(b[0]) : (a[1].average || 999) - (b[1].average || 999)) ) as [name, { average, placings }]}
			<tr>
				<td>{name}</td>
				<td>{average}</td>
				{#each Object.entries(placings).sort( (a, b) => a[0].localeCompare(b[0]) ) as [id, tournament]}
					{#each tournament.events as [event, place]}
						<td class="place" style="background-color: {colors[id]}" title={event}>{place}</td>
					{/each}
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	textarea {
		width: 100%;
		height: 10rem;
	}

	table {
		border-collapse: collapse;
	}
	table,
	td {
		border: 1px solid black;
		padding: 0.5rem;
	}
	td.place {
		color: #f5f5f5;
	}

	@media (prefers-color-scheme: dark) {
		table,
		td {
			border-color: #f5f5f5;
		}
	}
</style>
