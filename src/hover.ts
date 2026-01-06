import * as vscode from "vscode";
import { fasm, instructions, registers } from "./fasm.defs";

function ensureWidth(str: string, width: number) {
	const result: string[] = [];
	const it = str.split("\n").map((v, _) => v.split(" "));
	let tmp = "";
	for (let i = 0; i < it.length; ++i) {
		for (let j = 0; j < it[i].length; ++j) {
			const s = it[i][j];
			if (s.length >= width) {
				// if a word is by itself too wide
				// just put it on its own line
				if (tmp.length) {
					result.push(tmp);
					tmp = "";
				}
				result.push(s);
				continue;
			}
			if (tmp.length + s.length >= width) {
				result.push(tmp);
				tmp = "";
			}
			tmp += `${s} `;
		}
		// we can't just replace newlines with <br>
		// because '<br>' messes with length
		// making it look scuffed
		result.push(`${tmp || ""} <br>`);
		tmp = "";
	}

	if (result.length === 1) return result[0];
	return result.join(" <br> ");
}

const resultCache = new Map<string, vscode.MarkdownString>();

const hoverHeader = (kind: string, name: string, body: string) => `\`\`\`fasm
(${kind}) ${name}
\`\`\`

${ensureWidth(body, 60)}

`;

const mdLink = (text: string, url: string) => `[${text}](${url})`

type Flag = {
	bit: string;
	label: string;
	description: string;
};

const flagsRow = (flag: Flag) => `
<tr>
 <td align="center"><pre>${flag.bit}</pre></td>
 <td align="center">${flag.label || "-"}</td>
 <td align="center">${ensureWidth(flag.description, 40)}</td>
</tr>
`;

const flagsTable = (flags: Flag[]) => `
### Flags

<hr><br>
<table>
<thead>
  <tr>
    <th align="center">bit #</th>
    <th align="center">label</th>
    <th align="center">description</th>
  </tr>
</thead>
<tbody>
  ${flags.map(flagsRow).join("\n")}
</tbody>
</table>


`;

export default function hoverProvider() {
	// register regular expressions
	return vscode.languages.registerHoverProvider("fasm", {
		provideHover(document, position, _) {
			const result = new vscode.MarkdownString();
			result.supportHtml = true;
			const range = document.getWordRangeAtPosition(position);
			const text = document.getText(range);
			if (resultCache.has(text))
				return {
					contents: [resultCache.get(text) as vscode.MarkdownString],
					range: range,
				};
			if (text in fasm) {
				result.appendMarkdown(
					hoverHeader("keyword", text, fasm[text as keyof typeof fasm]),
				);
			} else if (text in registers) {
				const val = registers[text as keyof typeof registers];
				result.appendMarkdown(hoverHeader("register", text, val.description));

				if (val.flags.length) result.appendMarkdown(flagsTable(val.flags));
			} else if (text in instructions) {
				const val = instructions[text as keyof typeof instructions];
        result.appendMarkdown(hoverHeader("instruction", text, val.description))
        result.appendMarkdown(`[\`${text}\` reference](https://www.felixcloutier.com/x86/${val.name})`)
			} else {
				return null;
			}
			resultCache.set(text, result);
			return { contents: [result], range };
		},
	});
}
