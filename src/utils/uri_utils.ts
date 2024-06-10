import * as path from 'path';
import * as vscode from 'vscode';

export function resolveUris(file?: vscode.Uri, selectedFiles?: vscode.Uri[]): vscode.Uri[] {
    return selectedFiles && selectedFiles.length > 0 ? selectedFiles : (file ? [file] : []);
}

export async function collectFiltersWithProgress(uris: vscode.Uri[], isPartFiles: boolean): Promise<string[]> {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Collecting Part files...",
        cancellable: true
    }, async (progress, token) => {
        progress.report({ increment: 0, message: "Starting to collect files..." });

        /// TODO: Increment this URI by URI.
        const filesToProcess = (await Promise.all(uris.map(uri => collectDartFiles(uri)))).flat();

        progress.report({ increment: 50, message: "Files collected, gathering filters..." });
        const buildFilters = await collectBuildFiles(filesToProcess, isPartFiles);

        progress.report({ increment: 100, message: "Build filters ready." });

        return buildFilters;
    });
}

async function collectDartFiles(uri: vscode.Uri): Promise<vscode.Uri[]> {
    let filesToProcess: vscode.Uri[] = [];
    const stat = await vscode.workspace.fs.stat(uri);

    async function processUri(uri: vscode.Uri, type: vscode.FileType) {
        if (type === vscode.FileType.Directory) {
            const entries = await vscode.workspace.fs.readDirectory(uri);

            for (const [name, type] of entries) {
                await processUri(vscode.Uri.joinPath(uri, name), type);
            }
        } else if (type === vscode.FileType.File && uri.path.endsWith('.dart')) {
            filesToProcess.push(uri);
        }
    }

    await processUri(uri, stat.type);

    return filesToProcess;
}

async function findPartDefinitions(uri: vscode.Uri): Promise<string[]> {
    const content = await vscode.workspace.fs.readFile(uri);
    const contentStr = new TextDecoder("utf-8").decode(content);
    const partRegex = /part '(.+\.dart)';/g;
    let match;
    const parts = [];
    while ((match = partRegex.exec(contentStr)) !== null) {
        parts.push(match[1]);
    }
    return parts;
}

async function collectBuildFiles(uris: vscode.Uri[], isPartFiles: boolean = true): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw Error('No workspace folder found');
    }

    let filesToBuild: string[] = [];
    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    for (const uri of uris) {
        if (!isPartFiles) {
            const relativePath = path.relative(workspaceRoot, uri.fsPath);
            filesToBuild.push(relativePath);
        } else {
            const partFiles = await findPartDefinitions(uri);
            const relativePath = path.relative(workspaceRoot, uri.fsPath);
            const baseFolder = path.dirname(relativePath);
            const files = partFiles.map(partFile => path.join(baseFolder, partFile));
            filesToBuild = [...filesToBuild, ...files];
        }
    }

    return filesToBuild;
}