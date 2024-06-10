import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { createTerminal, runBuildRunner } from '../utils/terminalUtils';
import { collectFiltersWithProgress, resolveUris } from '../utils/uri_utils';

export enum DartCommandType {
    Build = "build",
    Watch = "watch"
}

export const contextMenuCommands = [
    { id: 'buildThisFile', type: DartCommandType.Build, isPartFiles: false, title: "Build this file" },
    { id: 'watchThisFile', type: DartCommandType.Watch, isPartFiles: false, title: "Watch this file" },
    { id: 'buildPartFiles', type: DartCommandType.Build, isPartFiles: true, title: "Build part files" },
    { id: 'watchPartFiles', type: DartCommandType.Watch, isPartFiles: true, title: "Watch part files" }
];

export function registerFileCommands(context: vscode.ExtensionContext) {
    contextMenuCommands.forEach(({ id, type, isPartFiles }) => {
        context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.${id}`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
            const uris = resolveUris(file, selectedFiles);
            if (uris.length === 0) {
                vscode.window.showWarningMessage("No Dart files selected.");
                return;
            }

            const buildFilters = await collectFiltersWithProgress(uris, isPartFiles);
            if (buildFilters.length > 0) {
                runDartCommand(buildFilters, type);
            } else {
                vscode.window.showWarningMessage("No part files found");
            }
        }));
    });
}

function runDartCommand(files: string[], commandType: DartCommandType) {
    const newTerminal = createTerminal(
        files,
        commandType,
    );

    runBuildRunner(
        newTerminal,
        files,
        commandType,
    );

    newTerminal.show();
}