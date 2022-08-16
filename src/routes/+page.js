import type { PageLoad } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	const modules = import.meta.glob('./*.svelte');
	const tools = await Promise.all(
		Object.entries(modules)
			.filter(([filename, _]) => !filename.startsWith('./_'))
			.map(async ([filename, module]) => {
				const { metadata } = await module();
				return { path: `/${filename.slice(2, -7)}/`, ...metadata };
			})
	);
	return {
		tools
	};
};
