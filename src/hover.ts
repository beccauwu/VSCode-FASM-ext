import * as vscode from "vscode";
import {fasm, instructions, registers} from "./hover.defs"

function splitString(str: string, width: number, xpad: number, centre = true) {
	const result = [];
	const it = str.split(" ");
	let tmp = "";
	const pad = (s: string) => {
		return s;
		// const len = s.length;
		// let toPad = width + xpad - len;
		// if (!centre) return `${s}${"&nbsp;".repeat(toPad)}`;
		// if (toPad % 2 !== 0) toPad++;
		// const padding = "&nbsp;".repeat(toPad / 2);
		// return `${padding}${s}${padding}`;
	};
	for (const s of it) {
		if (s.length >= width) {
			if (tmp.length) {
				result.push(pad(tmp));
				tmp = "";
			}
			result.push(pad(s));
			continue;
		}
		if (tmp.length + s.length >= width) {
			result.push(pad(tmp));
			tmp = "";
		}
		tmp += `${s} `;
	}
	if (tmp.length) result.push(pad(tmp));
	if (result.length === 1) return result[0];
	return result.join(" <br> ");
}

const resultCache = new Map<string, vscode.MarkdownString>();

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
					`\`\`\`fasm
(keyword) ${text}
\`\`\`

${splitString(fasm[text as keyof typeof fasm], 60, 0, false)}`,
				);
			} else if (text in registers) {
				const val = registers[text as keyof typeof registers];
				result.appendMarkdown(
					`\`\`\`fasm
(register) ${text}
\`\`\`
${splitString(val.description, 60, 0, false)}
`,
				);
				if (val.flags.length) {
					result.appendMarkdown(
						`
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
`,
					);
					val.flags.forEach((f, _) => {
						result.appendMarkdown(
							`
<tr>
 <td align="center"><pre>${f.bit}</pre></td>
 <td align="center">${f.label || "-"}</td>
 <td align="center">${splitString(f.description, 40, 4)}</td>
</tr>
`,
						);
					});
					result.appendMarkdown("</tbody></table>\n\n\n");
				}
			} else if (text in instructions) {
				const val = instructions[text as keyof typeof instructions];
				result.appendMarkdown(
					`\`\`\`fasm
(instruction) ${text}
\`\`\`

${splitString(val.description, 60, 0, false)}

[\`${text}\` reference](https://www.felixcloutier.com/x86/${val.name})
`,
				);
			} else {
				return null;
			}
			resultCache.set(text, result);
			return { contents: [result], range };
		},
	});
}

