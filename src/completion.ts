import * as vscode from "vscode";
import {
	fasmInstructions,
	fasmRegisters,
	fasmMacros,
	instructions,
	registers,
} from "./fasm.defs";

function completitionProviderString() {
	const completionItems = [
		...fasmInstructions.map((instruction) => {
			const res = new vscode.CompletionItem(
				instruction,
				vscode.CompletionItemKind.Keyword,
			);
			if (instruction in instructions) {
				res.detail = instructions[instruction].description;
			}
			return res;
		}),
		...fasmRegisters.map((register) => {
			const res = new vscode.CompletionItem(
				register,
				vscode.CompletionItemKind.Variable,
			);
			if (register in registers) {
				res.detail = registers[register].type;
			}
			return res;
		}),
		...fasmMacros.map(
			(macro) =>
				new vscode.CompletionItem(macro, vscode.CompletionItemKind.Function),
		),
	];
	return completionItems;
}

function completionProvider() {
	// for buttons switch
	vscode.commands.executeCommand("setContext", "fasm.mode.run", true);
	vscode.commands.executeCommand("setContext", "fasm.mode.debug", false);

	// register regular expressions
	return vscode.languages.registerCompletionItemProvider("fasm", {
		provideCompletionItems(document, _, _, _) {
			const prefixed_decls_r =
				/(?<prefix>(?:struc|macro|global|extrn|public))\s+(?<name>\w+)/g;
			const suffixed_decls_r =
				/(?<name>\w+)\s+(?<suffix>(?::|(?:file|db|dw|du|dd|dp|df|dq|dt)\??|(?:rb|rw|rd|rp|rf|rq|rt)))/g;
			const text = document.getText();
			const decls = new Map<string, vscode.CompletionItem>();
			for (const match of text.matchAll(prefixed_decls_r)) {
				if (!match.groups?.name || !match.groups?.prefix) throw "unreachable";
				const res = new vscode.CompletionItem(match.groups.name);
				switch (match.groups.prefix) {
					case "struc":
						res.kind = vscode.CompletionItemKind.Struct;
						break;
					case "macro":
						res.kind = vscode.CompletionItemKind.Function;
						break;
					default:
						res.kind = vscode.CompletionItemKind.Variable;
						break;
				}
				res.detail = `${match.groups.prefix} ${match.groups.name}`;
				res.sortText = "a";
				decls.set(match.groups.name, res);
			}
			for (const match of text.matchAll(suffixed_decls_r)) {
				if (!match.groups?.name || !match.groups?.suffix) throw "unreachable";
				const res = new vscode.CompletionItem(match.groups.name);
				switch (match.groups.suffix) {
					case ":":
						res.kind = vscode.CompletionItemKind.Function;
						res.detail = `local ${match.groups.name}`;
						break;
					default:
						res.kind = vscode.CompletionItemKind.Variable;
						res.detail = `${match.groups.name}: ${match.groups.suffix}`;
						break;
				}
				res.sortText = "a";
				if (!decls.has(match.groups.name)) decls.set(match.groups.name, res);
			}
			return [...decls.values(), ...completitionProviderString()];
		},
	});
}

export default completionProvider;
