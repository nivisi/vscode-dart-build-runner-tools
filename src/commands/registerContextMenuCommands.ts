import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { collectFiltersWithProgress, resolveUris } from '../utils/uri_utils';

enum DartCommandType {
    Build = "build",
    Watch = "watch"
}

export function registerFileCommands(context: vscode.ExtensionContext) {
    const commands = [
        { id: 'buildThisFile', type: DartCommandType.Build, isPartFiles: false },
        { id: 'watchThisFile', type: DartCommandType.Watch, isPartFiles: false },
        { id: 'buildPartFiles', type: DartCommandType.Build, isPartFiles: true },
        { id: 'watchPartFiles', type: DartCommandType.Watch, isPartFiles: true }
    ];

    commands.forEach(({ id, type, isPartFiles }) => {
        context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.${id}`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
            const uris = resolveUris(file, selectedFiles);
            if (uris.length === 0) {
                vscode.window.showWarningMessage("No Dart files selected.");
                return;
            }

            const buildFilters = await collectFiltersWithProgress(uris, isPartFiles);
            if (buildFilters.length > 0) {
                runDartCommand(buildFilters, type);
            }
        }));
    });
}

function runDartCommand(files: string[], commandType: DartCommandType) {
    const isWatch = commandType === DartCommandType.Watch;

    const buildFilters = files.map(file => `--build-filter=${file}`);

    const commandVariant = isWatch ? 'watch' : 'build';
    const baseCommand = 'dart run build_runner';
    const includeDeleteConflictingOutputs = vscode.workspace.getConfiguration().get<boolean>(`${commandPrefix}.deleteConflictingOutputs`, false);
    const deleteConflictingOutputsFlag = includeDeleteConflictingOutputs ? '--delete-conflicting-outputs' : '';

    const fullCommand = `${baseCommand} ${commandVariant} ${deleteConflictingOutputsFlag} --release ${buildFilters.join(' ')}`;

    var terminalName = `build_runner ${commandVariant}`;

    if (files.length === 1) {
        const fileName = files[0].split("/").reverse()[0];
        terminalName += ` (${fileName})`;
    } else {
        terminalName += ` (${files.length.toString()})`;
    }

    const iconPath = isWatch ? new vscode.ThemeIcon("eye") : new vscode.ThemeIcon("tools");
    const terminal = vscode.window.createTerminal({
        name: terminalName,
        iconPath: iconPath
    });

    terminal.sendText(fullCommand, true);
    terminal.show();
}