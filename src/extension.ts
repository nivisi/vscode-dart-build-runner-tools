import * as path from 'path';
import * as vscode from 'vscode';

enum DartCommandType {
	Build = "build",
	Watch = "watch"
}

const commandPrefix = "dartBuildRunnerTools";

export function activate(context: vscode.ExtensionContext) {
	/* Build / Watch commands */

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

	/* Configuring delete conflicting outputs */

	context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.enableDeleteConflictingOutputs`, () => {
		vscode.workspace.getConfiguration().update(`${commandPrefix}.deleteConflictingOutputs`, true, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(`Delete Conflicting Outputs is Enabled.`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.disableDeleteConflictingOutputs`, () => {
		vscode.workspace.getConfiguration().update(`${commandPrefix}.deleteConflictingOutputs`, false, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(`Delete Conflicting Outputs is Disabled.`);
	}));
}

function resolveUris(file?: vscode.Uri, selectedFiles?: vscode.Uri[]): vscode.Uri[] {
	return selectedFiles && selectedFiles.length > 0 ? selectedFiles : (file ? [file] : []);
}

async function collectFiltersWithProgress(uris: vscode.Uri[], isPartFiles: boolean): Promise<string[]> {
	return vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Collecting Build Filters...",
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

export function deactivate() { }