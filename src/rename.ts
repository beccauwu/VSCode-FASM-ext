import * as vscode from "vscode";

function find_by_name(name: string, document: vscode.TextDocument) {
	const fulltext = document.getText();
	let search_string = name;
	if (name.endsWith(":")) {
		// replacing label name at its definition
		search_string = name.substring(0, name.length - 1);
	} else if (!fulltext.includes(`${name}:`)) return null;
	//neg lookahead/behind to only match names, not substrings
	search_string = `(?<!\\w)${search_string.replaceAll(".", "\\.")}:?(?!\\w)`;
	const search_regex = new RegExp(search_string, "g");

	return fulltext.matchAll(search_regex);
}

export default function renameProvider() {
	// register regular expressions
	return vscode.languages.registerRenameProvider("fasm", {
		prepareRename(document, position, _) {
			const range = document.getWordRangeAtPosition(position, /\.?[\w\d]+/);
			if (!range) throw "range undefined";
			const text = document.getText(range);
			return { range, placeholder: text };
		},
		provideRenameEdits(document, position, newName, _) {
			const range = document.getWordRangeAtPosition(position, /\.?[\w\d]+:?/);
			if (!range) {
				vscode.window.showErrorMessage(
					`couldn't resolve range for token at line ${position.line}`,
				);
				return null;
			}
			const name = document.getText(range);
			const matches = find_by_name(name, document);
			if (matches === null) {
				vscode.window.showErrorMessage(`no definition for '${name}' found`);
				return null;
			}
			const edits = new vscode.WorkspaceEdit();
			for (const match of matches) {
				const m_pos = document.positionAt(match.index);
				const m_range = document.getWordRangeAtPosition(m_pos, /\.?[\w\d]+:?/);
				if (!m_range) {
					vscode.window.showErrorMessage(
						`couldn't resolve range for ${match[0]} at line ${m_pos.line}`,
					);
					return null;
				}
				const m_text = document.getText(m_range);
				let new_text = newName.trim();
				if (m_text.endsWith(":") && !newName.endsWith(":")) new_text += ":";
				edits.replace(document.uri, m_range, new_text);
			}
			return edits;
		},
	});
}
