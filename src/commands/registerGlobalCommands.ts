
import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { DartMultiplePubspecsWorkspaceType, DartNoPubspecWorkspaceType, DartSinglePubspecWorkspaceType, DartWorkspaceType, PubspecFile } from '../utils/analyzeWorkspaceType';
import { createTerminal, runBuildRunner } from '../utils/terminalUtils';
import { DartCommandType } from './registerContextMenuCommands';

export const workspaceCommands = [
    { id: 'buildWorkspace', type: DartCommandType.Build, title: "Build" },
    { id: 'watchWorkspace', type: DartCommandType.Watch, title: "Watch" },
];

export async function registerWorkspaceCommands(context: vscode.ExtensionContext) {
    const workspaceType = await DartWorkspaceType.getFromContext(context);

    if (!workspaceType || workspaceType instanceof DartNoPubspecWorkspaceType) {
        return;
    }

    workspaceCommands.forEach(({ id, type, title }) => {
        const command = vscode.commands.registerCommand(
            `${commandPrefix}.${id}`,
            async (file?: vscode.Uri | PubspecFile, selectedFiles?: vscode.Uri[]) => {
                var pubspec: PubspecFile | undefined;

                if (file instanceof PubspecFile) {
                    pubspec = file;
                }

                const terminal = createTerminal([], type, true, pubspec);
                runBuildRunner(terminal, [], type);

                terminal.show();
            }
        );

        context.subscriptions.push(command);
    });

    switch (workspaceType) {
        case DartNoPubspecWorkspaceType:
            /* Nothing to do */
            break;
        case DartSinglePubspecWorkspaceType:

            break;
        case DartMultiplePubspecsWorkspaceType:
            break;
        default:
            break;
    }
}