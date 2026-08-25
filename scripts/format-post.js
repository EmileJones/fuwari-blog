/* Format an existing Markdown file as a Fuwari blog post. */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt();

const FRONTMATTER_DEFAULTS = [
	["description", "description: ''"],
	["image", "image: ''"],
	["tags", "tags: []"],
	["category", "category: ''"],
	["draft", "draft: false"],
	["lang", "lang: ''"],
];

function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function splitFrontmatter(lines) {
	if (lines[0] !== "---") {
		return { frontmatter: null, body: lines };
	}

	const closingIndex = lines.findIndex(
		(line, index) => index > 0 && (line === "---" || line === "..."),
	);
	if (closingIndex === -1) {
		throw new Error("Frontmatter is missing its closing delimiter");
	}

	return {
		frontmatter: lines.slice(0, closingIndex + 1),
		body: lines.slice(closingIndex + 1),
	};
}

function headingText(inlineToken) {
	if (!inlineToken?.children) {
		return inlineToken?.content.trim() ?? "";
	}

	return inlineToken.children
		.map((token) => {
			if (token.type === "softbreak" || token.type === "hardbreak") return " ";
			if (token.type === "html_inline") {
				return token.content.replace(/<[^>]*>/g, "");
			}
			if (
				token.type === "text" ||
				token.type === "code_inline" ||
				token.type === "image" ||
				token.type.endsWith("_inline")
			) {
				return token.content;
			}
			return "";
		})
		.join("")
		.replace(/\s+/g, " ")
		.trim();
}

function findHeadings(bodyLines) {
	const tokens = markdown.parse(bodyLines.join("\n"), {});
	const headings = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];
		if (token.type !== "heading_open" || !token.map) continue;

		headings.push({
			level: Number(token.tag.slice(1)),
			markup: token.markup,
			start: token.map[0],
			end: token.map[1],
			text: headingText(tokens[index + 1]),
		});
	}

	return headings;
}

function promoteHeadings(bodyLines, headings) {
	const result = [...bodyLines];

	for (const heading of [...headings].reverse()) {
		if (heading.level === 1) {
			result.splice(heading.start, heading.end - heading.start);
			continue;
		}

		if (heading.markup === "-") {
			const underlineIndex = heading.end - 1;
			result[underlineIndex] = result[underlineIndex].replace(/-/g, "=");
			continue;
		}

		result[heading.start] = result[heading.start].replace(
			/^(\s{0,3})#(?=#{1,5}(?:\s|$))/,
			"$1",
		);
	}

	return result;
}

function updateFrontmatter(frontmatter, title, published) {
	const values = new Map([
		["title", `title: ${JSON.stringify(title)}`],
		["published", `published: ${published}`],
		...FRONTMATTER_DEFAULTS,
	]);
	const seen = new Set();
	const closingDelimiter = frontmatter.at(-1);
	const result = [frontmatter[0]];

	for (const line of frontmatter.slice(1, -1)) {
		const match = line.match(/^([A-Za-z_][\w-]*):/);
		const key = match?.[1];
		if (key && values.has(key)) {
			if (!seen.has(key)) result.push(values.get(key));
			seen.add(key);
		} else {
			result.push(line);
		}
	}

	for (const [key, line] of values) {
		if (!seen.has(key)) result.push(line);
	}

	result.push(closingDelimiter);
	return result;
}

export function formatMarkdown(source, filePath, published = getDate()) {
	const hasBom = source.startsWith("\uFEFF");
	const content = hasBom ? source.slice(1) : source;
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const { frontmatter, body } = splitFrontmatter(lines);
	const headings = findHeadings(body);
	const h1Headings = headings.filter((heading) => heading.level === 1);
	const hasSingleH1 = h1Headings.length === 1;
	const title = hasSingleH1
		? h1Headings[0].text
		: path.basename(filePath, path.extname(filePath));
	const formattedBody = hasSingleH1 ? promoteHeadings(body, headings) : body;
	const formattedFrontmatter = updateFrontmatter(
		frontmatter ?? ["---", "---"],
		title,
		published,
	);

	if (formattedBody[0] !== "") formattedBody.unshift("");

	return {
		content:
			(hasBom ? "\uFEFF" : "") +
			[...formattedFrontmatter, ...formattedBody].join(eol),
		title,
		titleSource: hasSingleH1 ? "heading" : "filename",
		promotedHeadings: hasSingleH1,
	};
}

export function formatFile(filePath) {
	const resolvedPath = path.resolve(filePath);
	const extension = path.extname(resolvedPath).toLowerCase();
	if (extension !== ".md" && extension !== ".mdx") {
		throw new Error("Input file must have a .md or .mdx extension");
	}
	if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
		throw new Error(`Input file does not exist: ${resolvedPath}`);
	}

	const source = fs.readFileSync(resolvedPath, "utf8");
	const result = formatMarkdown(source, resolvedPath);
	const temporaryPath = path.join(
		path.dirname(resolvedPath),
		`.${path.basename(resolvedPath)}.${process.pid}.tmp`,
	);

	try {
		fs.writeFileSync(temporaryPath, result.content, "utf8");
		fs.chmodSync(temporaryPath, fs.statSync(resolvedPath).mode);
		fs.renameSync(temporaryPath, resolvedPath);
	} catch (error) {
		if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
		throw error;
	}

	return { ...result, path: resolvedPath };
}

function main() {
	const args = process.argv.slice(2);
	if (args.length !== 1) {
		console.error(`Error: Expected exactly one Markdown file path
Usage: pnpm format-post <path-to-file.md>`);
		process.exitCode = 1;
		return;
	}

	try {
		const result = formatFile(args[0]);
		const headingResult = result.promotedHeadings
			? "removed the single H1 and promoted lower headings"
			: "left heading levels unchanged";
		console.log(
			`Formatted ${result.path}\nTitle: ${result.title} (${result.titleSource}); ${headingResult}`,
		);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exitCode = 1;
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	main();
}
