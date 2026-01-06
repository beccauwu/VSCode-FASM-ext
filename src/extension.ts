import * as vscode from "vscode";
import completionProvider from "./completion";
import hoverProvider from "./hover";
import renameProvider from "./rename";
import commands from "./commands";
import config from "./config";

export function activate(context: vscode.ExtensionContext) {
	// register buttons & provider
	const completions = completionProvider();
	const hover = hoverProvider();
	const rename = renameProvider();

	// register commands
	const createConfigCommand = vscode.commands.registerCommand(
		"fasm.createConfigs",
		async () => await commands.createConfigCommand(),
	);
	const showDropdownCommand = vscode.commands.registerCommand(
		"fasm.showDropdown",
		async () => await commands.showDropdownCommand(),
	);
	const debugCommand = vscode.commands.registerCommand(
		"fasm.debug",
		async () => await commands.debugCommand(context.extensionPath),
	);
	const runCommand = vscode.commands.registerCommand(
		"fasm.run",
		async () => await commands.runCommand(),
	);
	const buildCommand = vscode.commands.registerCommand(
		"fasm.build",
		async () => await commands.buildCommand(),
	);

	if (vscode.window.activeTextEditor?.document.languageId === "fasm") {
		config.checkAndCreateConfigs();
	}

	context.subscriptions.push(
		completions,
		hover,
		rename,
		createConfigCommand,
		showDropdownCommand,
		debugCommand,
		runCommand,
		buildCommand,
	);
}

export function deactivate() {}
