import { component, defineMarkdocConfig } from "@astrojs/markdoc/config";

export default defineMarkdocConfig({
	tags: {
		download: {
			render: component("./src/components/content/Download.astro"),
			attributes: {
				href: { type: String, required: true },
				text: { type: String, required: true },
				filename: { type: String },
			},
		},
	},
});
