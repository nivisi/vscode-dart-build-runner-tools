import * as vscode from 'vscode';
import { analyzeWorkspaceType } from '../utils/analyzeWorkspaceType';

/// Registers a watcher of `pubspec.yaml` files,
/// that triggers a workspace analysis when a change is detected.
/// Required in order to show the correct commands in the context menu.
export function watchFileChanges(context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher("**/pubspec.yaml");
    watcher.onDidChange(uri => {
        console.log("BR Tools: pubspec.yaml changed, analyzing workspace ...");
        analyzeWorkspaceType(context);
    });
    watcher.onDidCreate(uri => {
        console.log("BR Tools: pubspec.yaml created, analyzing workspace ...");
        analyzeWorkspaceType(context);
    });
    watcher.onDidDelete(uri => {
        console.log("BR Tools: pubspec.yaml deleted, analyzing workspace ...");
        analyzeWorkspaceType(context);
    });
    context.subscriptions.push(watcher);
}