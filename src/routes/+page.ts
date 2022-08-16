import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const modules = import.meta.glob('./**/+page.svelte');
	const tools = await Promise.all(
		Object.entries(modules)
			.filter(([filename, _]) => !filename.startsWith('./+'))
			.map(async ([filename, module]) => {
				const { metadata } = (await module()) as {
					metadata: { title: string; description: string };
				};
				return { path: `/${filename.slice(2, -7)}/`, ...metadata };
			})
	);
	return {
		tools
	};
};
