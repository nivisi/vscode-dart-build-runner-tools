import * as path from 'path';
import * as vscode from 'vscode';

enum DartCommandType {
	Build = "build",
	Watch = "watch"
}

const commandPrefix = "dartBuildRunnerTools";

export function activate(context: vscode.ExtensionContext) {
	/* Specific file generation */

	const commands = [
		{ id: 'buildThisFile', type: DartCommandType.Build, isPartFiles: false },
		{ id: 'watchThisFile', type: DartCommandType.Watch, isPartFiles: false },
		{ id: 'buildPartFiles', type: DartCommandType.Build, isPartFiles: true },
		{ id: 'watchPartFiles', type: DartCommandType.Watch, isPartFiles: true }
	];

	commands.forEach(({ id, type, isPartFiles }) => {
		context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.${id}`, async (uri?: vscode.Uri) => {
			await processCommand(type, uri, isPartFiles);
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

async function processCommand(commandType: DartCommandType, uri?: vscode.Uri, isPartFiles: boolean = true) {
	uri = uri || vscode.window.activeTextEditor?.document.uri || vscode.workspace.workspaceFolders?.[0]?.uri;

	if (!uri) {
		vscode.window.showWarningMessage("No active Dart file or workspace folder found.");
		return;
	}

	const buildFilters = await collectFiltersWithProgress(uri, isPartFiles);
	if (buildFilters.length > 0) {
		runDartCommand(buildFilters, commandType);
	}
}

async function collectFiltersWithProgress(uri: vscode.Uri, isPartFiles: boolean = true): Promise<string[]> {
	return vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Collecting Build Filters...",
		cancellable: true // Or false, depending on whether you want to allow cancellation
	}, async (progress, token) => {
		token.onCancellationRequested(() => {
			console.log("User canceled the build filter collection.");
			// Handle cancellation if necessary, e.g., by cleaning up or stopping the operation
		});

		progress.report({ increment: 0, message: "Starting to collect files..." });

		// Collect Dart files
		const filesToProcess = await collectDartFiles(uri);
		progress.report({ increment: 50, message: "Files collected, gathering filters..." });

		// Collect Build Filters
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