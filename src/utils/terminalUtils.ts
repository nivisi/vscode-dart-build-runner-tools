import * as vscode from 'vscode';
import { DartCommandType } from "../commands/registerContextMenuCommands";
import { commandPrefix } from '../extension';


export function createTerminal(
    files?: string[],
    commandType?: DartCommandType,
    shouldTerminatePreviousTerminal: boolean = true,
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
        terminalName += ` (${vscode.workspace.name})`;

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

    return terminal;
}

export function runBuildRunner(
    terminal: vscode.Terminal,
    files: string[],
    commandType: DartCommandType,
) {
    const commandVariant = commandType === DartCommandType.Watch ? 'watch' : 'build';
    const baseCommand = 'dart run build_runner';
    const includeDeleteConflictingOutputs = vscode.workspace.getConfiguration().get<boolean>(`${commandPrefix}.deleteConflictingOutputs`, false);
    const deleteConflictingOutputsFlag = includeDeleteConflictingOutputs ? '--delete-conflicting-outputs' : '';

    const buildFilters = files.map(file => `--build-filter=${file}`);

    const fullCommand = `${baseCommand} ${commandVariant} ${deleteConflictingOutputsFlag} --release ${buildFilters.join(' ')}`;

    terminal.sendText(fullCommand, true);
}