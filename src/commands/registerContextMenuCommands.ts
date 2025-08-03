import * as path from 'path';
import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { DartMultiplePubspecsWorkspaceType, DartNoPubspecWorkspaceType, DartSinglePubspecWorkspaceType, DartWorkspaceType, PubspecFile } from '../utils/analyzeWorkspaceType';
import { createTerminal, runBuildRunner } from '../utils/terminalUtils';
import { collectFilesToBuildWithProgress, resolveUris } from '../utils/uri_utils';

export enum DartCommandType {
    Build = "build",
    Watch = "watch"
}

export const contextMenuCommands = [
    { id: 'buildThisFile', type: DartCommandType.Build, isPartFile: false, title: "Build this file" },
    { id: 'watchThisFile', type: DartCommandType.Watch, isPartFile: false, title: "Watch this file" },
    { id: 'buildPartFiles', type: DartCommandType.Build, isPartFile: true, title: "Build part files" },
    { id: 'watchPartFiles', type: DartCommandType.Watch, isPartFile: true, title: "Watch part files" }
];

export function registerFileCommands(context: vscode.ExtensionContext) {
    contextMenuCommands.forEach(({ id, type, isPartFile: isPartFile }) => {
        context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.${id}`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
            const uris = resolveUris(file, selectedFiles);
            if (uris.length === 0) {
                vscode.window.showWarningMessage("No Dart files selected.");
                return;
            }

            const filesToBuild = await collectFilesToBuildWithProgress(uris, isPartFile);
            if (filesToBuild.length > 0) {
                runDartCommandFromContextMenu(context, filesToBuild, type);
            } else {
                vscode.window.showWarningMessage("No dart files found");
            }
        }));
    });
}

async function runDartCommandFromContextMenu(context: vscode.ExtensionContext, files: string[], commandType: DartCommandType) {
    if (files.length === 0) {
        vscode.window.showWarningMessage(`No files have been selected.`);
        return;
    }

    const pubspecFileDartFilesMap = await mapDartFilesToPubspecFiles(context, files);

    if (pubspecFileDartFilesMap.size === 0) {
        const filesStr = files.length === 1 ? 'file' : 'files';
        vscode.window.showWarningMessage(`Selected ${filesStr} cannot be built. Most likely there is no suitable pubspec.yaml found.`);
        return;
    }

    for (const [pubspec, dartFiles] of pubspecFileDartFilesMap) {
        const newTerminal = createTerminal(
            dartFiles,
            commandType,
            true,
            pubspec
        );

        runBuildRunner(
            context,
            newTerminal,
            dartFiles,
            commandType,
            pubspec
        );

        newTerminal.show();
    }
}

async function mapDartFilesToPubspecFiles(context: vscode.ExtensionContext, files: string[]): Promise<Map<PubspecFile, string[]>> {
    const pubspecFileDartFilesMap = new Map<PubspecFile, string[]>();
    const workspaceType = await DartWorkspaceType.getFromContext(context);
    if (!workspaceType) {
        vscode.window.showWarningMessage(`No Dart workspace found.`);
        return pubspecFileDartFilesMap;
    }

    const pubspecFiles: PubspecFile[] = [];
    switch (workspaceType.constructor) {
        case DartNoPubspecWorkspaceType:
            return pubspecFileDartFilesMap;
        case DartSinglePubspecWorkspaceType:
            pubspecFiles.push((workspaceType as DartSinglePubspecWorkspaceType).pubspec);
            break;
        case DartMultiplePubspecsWorkspaceType:
            pubspecFiles.push(...(workspaceType as DartMultiplePubspecsWorkspaceType).pubspecs);
            break;
    }


    for (const file of files) {
        var parentPubspec: PubspecFile | undefined;
        var libIndex = file.lastIndexOf(`lib${path.sep}`);

        while (libIndex !== -1) {
            const potentialParentPubspecPath = path.sep + file.substring(0, libIndex) + 'pubspec.yaml';
            parentPubspec = pubspecFiles.find(pubspec => pubspec.workspaceUri.fsPath === potentialParentPubspecPath);
            if (parentPubspec) {
                break;
            }

            libIndex = file.lastIndexOf(`lib${path.sep}`, libIndex - 1);
        }

        if (!parentPubspec) {
            continue;
        }

        const dartFiles = pubspecFileDartFilesMap.get(parentPubspec) || [];
        dartFiles.push(file);
        pubspecFileDartFilesMap.set(parentPubspec, dartFiles);
    }

    return pubspecFileDartFilesMap;
}