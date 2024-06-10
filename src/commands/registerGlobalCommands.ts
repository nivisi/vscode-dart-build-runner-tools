
import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { createTerminal, runBuildRunner } from '../utils/terminalUtils';
import { DartCommandType } from './registerContextMenuCommands';

export const workspaceCommands = [
    { id: 'buildWorkspace', type: DartCommandType.Build, title: "Build" },
    { id: 'watchWorkspace', type: DartCommandType.Watch, title: "Watch" },
];

export function registerWorkspaceCommands(context: vscode.ExtensionContext) {
    workspaceCommands.forEach(({ id, type, title }) => {
        context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.${id}`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
            const terminal = createTerminal([], type);
            runBuildRunner(terminal, [], type);

            terminal.show();
        }));
    });
}