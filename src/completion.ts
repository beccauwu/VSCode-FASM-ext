import * as vscode from 'vscode';
import {fasmInstructions, fasmRegisters, fasmMacros} from "./fasm.defs"

function completitionProviderString() {
    const completionItems = [
        ...fasmInstructions.map(instruction => 
            new vscode.CompletionItem(instruction, vscode.CompletionItemKind.Keyword)),
        ...fasmRegisters.map(register => 
            new vscode.CompletionItem(register, vscode.CompletionItemKind.Variable)),
        ...fasmMacros.map(macro => 
            new vscode.CompletionItem(macro, vscode.CompletionItemKind.Function))
    ];
    return completionItems;
}

function completionProvider() {
    // for buttons switch
    vscode.commands.executeCommand('setContext', 'fasm.mode.run', true);
    vscode.commands.executeCommand('setContext', 'fasm.mode.debug', false);

    // register regular expressions
    return vscode.languages.registerCompletionItemProvider('fasm', { provideCompletionItems() { return completitionProviderString() } });    
}

export default completionProvider