import * as vscode from 'vscode';
import { registerFileCommands as registerContextMenuCommands } from './commands/registerContextMenuCommands';
import { registerWorkspaceCommands } from './commands/registerGlobalCommands';
import { registerNavigationMenuCommands } from './commands/registerNavigationMenuCommands';
import { registerToggleConflictingOutputsFlagCommand } from './commands/registerToggleConflictingOutputsFlagCommand';

export const commandPrefix = "dartBuildRunnerTools";

export function activate(context: vscode.ExtensionContext) {
	registerWorkspaceCommands(context);
	registerNavigationMenuCommands(context);
	registerContextMenuCommands(context);
	registerToggleConflictingOutputsFlagCommand(context);
}

export function deactivate() { }