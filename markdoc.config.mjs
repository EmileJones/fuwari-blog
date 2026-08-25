import { component, defineMarkdocConfig } from "@astrojs/markdoc/config";

export default defineMarkdocConfig({
	tags: {
		columns: {
			render: component("./src/components/content/columns/Columns.astro"),
			attributes: {
				columns: { type: Number, default: 2 },
				gap: { type: String, default: "1rem" },
				minWidth: { type: String, default: "16rem" },
			},
		},
		column: {
			render: component("./src/components/content/columns/Column.astro"),
		},
	},
});
