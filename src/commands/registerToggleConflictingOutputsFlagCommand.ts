import * as vscode from 'vscode';
import { commandPrefix } from '../extension';


export function registerToggleConflictingOutputsFlagCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.enableDeleteConflictingOutputs`, () => {
        vscode.workspace.getConfiguration().update(`${commandPrefix}.deleteConflictingOutputs`, true, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Delete Conflicting Outputs is Enabled.`);
    }));

    context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.disableDeleteConflictingOutputs`, () => {
        vscode.workspace.getConfiguration().update(`${commandPrefix}.deleteConflictingOutputs`, false, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Delete Conflicting Outputs is Disabled.`);
    }));
}