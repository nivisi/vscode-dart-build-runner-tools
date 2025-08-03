import path from 'path';
import * as vscode from 'vscode';
import { DartCommandType } from "../commands/registerContextMenuCommands";
import { commandPrefix } from '../extension';
import { PubspecFile } from './analyzeWorkspaceType';
import { resolveDartExecutable } from './resolveDartExecutable';

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
            const fileName = files[0].split(path.sep).reverse()[0];
            terminalName += ` (${fileName})`;
        } else {
            terminalName += ` (${files.length.toString()})`;
            shouldTerminatePreviousTerminal = false;
        }
    } else {
        if (pubspec && !pubspec.isRoot) {
            terminalName += ` (${pubspec?.packageName})`;
        }
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
        var pathToCd = pubspec.workspaceUri.fsPath;
        if (pathToCd[0] === path.sep) {
            pathToCd = pathToCd.slice(1);
        }
        terminal.sendText(`cd ${pathToCd.replace(`${path.sep}pubspec.yaml`, '')}`, true);
    }

    return terminal;
}

export function runBuildRunner(
    context: vscode.ExtensionContext,
    terminal: vscode.Terminal,
    files: string[],
    commandType: DartCommandType,
    pubspecFile?: PubspecFile
) {
    const commandVariant = commandType === DartCommandType.Watch ? 'watch' : 'build';

    const executable = resolveDartExecutable(context);
    const baseCommand = `${executable} run build_runner`;

    const includeDeleteConflictingOutputs = vscode.workspace.getConfiguration().get<boolean>(`${commandPrefix}.deleteConflictingOutputs`, false);
    const deleteConflictingOutputsFlag = includeDeleteConflictingOutputs ? '--delete-conflicting-outputs' : '';

    var filePath = pubspecFile?.workspaceUri.fsPath;
    if (filePath && filePath[0] === path.sep) {
        filePath = filePath.slice(1);
    }

    const workspaceToReplace = filePath?.replace(`${path.sep}pubspec.yaml`, '') ?? '';

    if (pubspecFile) {
        files = files.map(
            file => file.replace(
                workspaceToReplace,
                ''
            )
        );
    }

    const buildFilters = files.map(file => `--build-filter=${file[0] === path.sep ? file.slice(1) : file} `);

    const fullCommand = `${baseCommand} ${commandVariant} ${deleteConflictingOutputsFlag} --release ${buildFilters.join(' ')}`;

    terminal.sendText(fullCommand, true);
}