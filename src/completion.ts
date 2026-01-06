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
      if(register in registers) {
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
		provideCompletionItems() {
			return completitionProviderString();
		},
	});
}

export default completionProvider;
