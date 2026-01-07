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

type LocalDef = {
  name: string;
  type: string;
  pos: vscode.Position;
}

function find_definition(name: string, document: vscode.TextDocument): LocalDef | null {
	const fulltext = document.getText();
  let stripped = name;
	if (name.endsWith(":")) {
		// replacing label name at its definition
		stripped = name.substring(0, name.length - 1);
	}
  stripped = stripped.replaceAll(".", "\\.").trim();
	//neg lookahead/behind to only match names, not substrings
  const prefixes = "(?:struc|macro|global|extrn|public)"
  const suffixes = "(?::|(?:file|db|dw|du|dd|dp|df|dq|dt)\\??|(?:rb|rw|rd|rp|rf|rq|rt))"
	const search_string = `(?<prefix>${prefixes})?\\s*(?<!\\w)(?<name>${stripped})(?!\\w)\\s*(?<suffix>${suffixes})?`;
	const search_regex = new RegExp(search_string);
	const match = fulltext.match(search_regex);
	if (!match || !match.index || !match.groups) return null;
  if(match.groups.prefix !== undefined) {
    return {
      name: stripped,
      type: match.groups.prefix,
      pos: document.positionAt(match.index)
    }
  }
  else if(match.groups.suffix !== undefined) {
    return {
      name: stripped,
      type: match.groups.suffix === ":" ? "local" : match.groups.suffix,
      pos: document.positionAt(match.index)
    }
  }
	return null;
}

type DocWithDef = [s: string, d: LocalDef];

function find_doc_comment(name: string, document: vscode.TextDocument): DocWithDef | null {
	let def: LocalDef | null;
	if (!(def = find_definition(name, document))) return null;
	const docs: string[] = [];
	let m: RegExpMatchArray | null;
	if (def.pos.line >= 0) {
		for (let offs = 1; ; ++offs) {
      const dl = def.pos.line - offs;
      if(dl < 0) break;
			const l = document.lineAt(dl);
			if (!(m = l.text.match(/(?:^\s*)[;]+(?<doc>.*)/))) break;
			if (!m.groups) throw "unreachable";
			docs.push(m.groups.doc);
		}
    if (!docs.length) {
      // fallback to comment on same line
      if (
        (m = document.lineAt(def.pos.line).text.match(/(?:\s*)[;]+(?<doc>.*)/)) !==
        null
      ) {
        if (!m.groups) throw "unreachable";
        docs.push(m.groups.doc);
      }
    }
	}
	return [docs.reverse().join(" <br> "), def];
}

export default function hoverProvider() {
	// register regular expressions
	return vscode.languages.registerHoverProvider("fasm", {
		provideHover(document, position, _) {
			const result = new vscode.MarkdownString();
			result.supportHtml = true;
			const range = document.getWordRangeAtPosition(position, /\.?[\w\d#]+/);
			const text = document.getText(range);
			let doc: DocWithDef | null;
			if (resultCache.has(text))
				return {
					contents: [resultCache.get(text) as vscode.MarkdownString],
					range: range,
				};
			if (text in fasm) {
				result.appendMarkdown(
					hoverHeader("keyword", text, fasm[text as keyof typeof fasm]),
				);
				resultCache.set(text, result);
			} else if (text in registers) {
				const val = registers[text as keyof typeof registers];
				result.appendMarkdown(hoverHeader("register", text, val.description));
				result.appendMarkdown(
					`
- **type** &nbsp;&nbsp;&nbsp;${val.type}
- **width** &nbsp;${val.width}`,
				);

				if (val.flags.length) result.appendMarkdown(flagsTable(val.flags));
				resultCache.set(text, result);
			} else if (text in instructions) {
				const val = instructions[text as keyof typeof instructions];
				result.appendMarkdown(
					hoverHeader("instruction", text, val.description),
				);
				result.appendMarkdown(
					`[\`${text}\` reference](https://www.felixcloutier.com/x86/${val.name})`,
				);
				resultCache.set(text, result);
			} else if ((doc = find_doc_comment(text, document)) !== null) {
				result.appendMarkdown(hoverHeader(doc[1].type, text, doc[0]));
			} else {
				return null;
			}
			return { contents: [result], range };
		},
	});
}
