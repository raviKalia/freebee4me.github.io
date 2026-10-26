import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import ts from 'typescript';

// Format source files while keeping JSX opening tags on one line.
const root = fileURLToPath(new URL('../', import.meta.url));
const extensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs', '.css', '.json', '.html']);
const ignored = new Set(['node_modules', '.git', 'dist']);
let count = 0;

async function formatDirectory(directory) {
	for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (!ignored.has(entry.name)) await formatDirectory(file);
			continue;
		}
		if (!extensions.has(path.extname(file)) || /package-lock\.json$/.test(file)) continue;
		const input = await fs.readFile(file, 'utf8');
		let output = await prettier.format(input, {
			filepath: file,
			useTabs: true,
			singleQuote: true,
			printWidth: 110,
			trailingComma: 'all',
		});
		if (file.endsWith('.tsx')) {
			const source = ts.createSourceFile(file, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
			const edits = [];
			function visit(node) {
				if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
					const start = node.getStart(source);
					const text = output.slice(start, node.end);
					// Preserve line comments and template literal contents.
					if (!text.includes('//') && !text.includes('`')) {
						edits.push({ start, end: node.end, text: text.replace(/\s*\n\s*/g, ' ') });
					}
					return;
				}
				ts.forEachChild(node, visit);
			}
			visit(source);
			for (const edit of edits.sort((a, b) => b.start - a.start)) {
				output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
			}
		}
		await fs.writeFile(file, output);
		count++;
	}
}

await formatDirectory(root);
console.log(`Formatted ${count} files.`);
