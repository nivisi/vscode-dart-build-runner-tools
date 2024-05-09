import * as vscode from 'vscode';
import { registerFileCommands as registerContextMenuCommands } from './commands/registerContextMenuCommands';
import { registerToggleConflictingOutputsFlagCommand } from './commands/registerToggleConflictingOutputsFlagCommand';

export const commandPrefix = "dartBuildRunnerTools";

export function activate(context: vscode.ExtensionContext) {
	registerContextMenuCommands(context);
	registerToggleConflictingOutputsFlagCommand(context);
}

export function deactivate() { }