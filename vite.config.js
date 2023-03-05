import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			devOptions: {
				enabled: true
			},
			manifest: {
				name: 'Tools',
				short_name: 'Tools',
				icons: [
					{
						src: '/android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				],
				theme_color: '#8eb039',
				background_color: '#8eb039',
				display: 'standalone'
			}
		})
	]
};

export default config;
