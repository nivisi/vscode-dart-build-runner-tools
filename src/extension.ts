import * as vscode from 'vscode';
import { registerFileCommands as registerContextMenuCommands } from './commands/registerContextMenuCommands';
import { registerWorkspaceCommands } from './commands/registerGlobalCommands';
import { registerNavigationMenuCommands } from './commands/registerNavigationMenuCommands';
import { registerToggleConflictingOutputsFlagCommand } from './commands/registerToggleConflictingOutputsFlagCommand';
import { watchFileChanges as watchPubspecChanges } from './subscriptions/watchFileChanges';
import { analyzeWorkspaceType, DartNoPubspecWorkspaceType } from './utils/analyzeWorkspaceType';

export const commandPrefix = "dartBuildRunnerTools";

export async function activate(context: vscode.ExtensionContext) {
	const workspaceType = await analyzeWorkspaceType(context);

	if (workspaceType instanceof DartNoPubspecWorkspaceType) {
		vscode.window.showWarningMessage("No pubspec.yaml found in workspace");
		return;
	}

	watchPubspecChanges(context);

	registerWorkspaceCommands(context);
	registerNavigationMenuCommands(context);
	registerContextMenuCommands(context);
	registerToggleConflictingOutputsFlagCommand(context);
}

export function deactivate() { }