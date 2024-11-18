import * as vscode from 'vscode';
import { DartCommandType } from "../commands/registerContextMenuCommands";
import { commandPrefix } from '../extension';
import { PubspecFile } from './analyzeWorkspaceType';


export function createTerminal(
    files?: string[],
    commandType?: DartCommandType,
    shouldTerminatePreviousTerminal: boolean = true,
    pubspec?: PubspecFile,
): vscode.Terminal {
    var terminalName = 'build_runner';

    if (commandType) {
        const command = commandType === DartCommandType.Watch
            ? 'watch'
            : 'build';

        terminalName += ` ${command}`;
    }


    if (files && files.length > 0) {
        if (files.length === 1) {
            const fileName = files[0].split("/").reverse()[0];
            terminalName += ` (${fileName})`;
        } else {
            terminalName += ` (${files.length.toString()})`;
            shouldTerminatePreviousTerminal = false;
        }
    } else {
        terminalName += ` (${pubspec?.packageName})`;
    }

    if (shouldTerminatePreviousTerminal) {
        vscode.window.terminals.filter(e => e.name === terminalName).forEach(
            e => {
                e.hide();
                e.dispose();
            }
        );
    }

    const iconPath = commandType === DartCommandType.Watch ? new vscode.ThemeIcon("eye") : new vscode.ThemeIcon("tools");
    const terminal = vscode.window.createTerminal({
        name: terminalName,
        iconPath: iconPath
    });

    if (!pubspec) {
        return terminal;
    }

    if (!pubspec.isRoot) {
        terminal.sendText(`cd ${pubspec.workspaceUri.fsPath.slice(1).replace('/pubspec.yaml', '')}`, true);
    }

    return terminal;
}

export function runBuildRunner(
    terminal: vscode.Terminal,
    files: string[],
    commandType: DartCommandType,
    pubspecFile?: PubspecFile
) {
    const commandVariant = commandType === DartCommandType.Watch ? 'watch' : 'build';
    const baseCommand = 'dart run build_runner';
    const includeDeleteConflictingOutputs = vscode.workspace.getConfiguration().get<boolean>(`${commandPrefix}.deleteConflictingOutputs`, false);
    const deleteConflictingOutputsFlag = includeDeleteConflictingOutputs ? '--delete-conflicting-outputs' : '';

    const workspaceToReplace = pubspecFile?.workspaceUri.fsPath.replace('/pubspec.yaml', '').slice(1) ?? '';

    if (pubspecFile) {
        files = files.map(
            file => file.replace(
                workspaceToReplace,
                ''
            )
        );
    }

    const buildFilters = files.map(file => `--build-filter=${file.slice(1)}`);

    const fullCommand = `${baseCommand} ${commandVariant} ${deleteConflictingOutputsFlag} --release ${buildFilters.join(' ')}`;

    terminal.sendText(fullCommand, true);
}