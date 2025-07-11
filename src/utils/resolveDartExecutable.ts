import { existsSync } from "fs";
import path from "path";
import * as vscode from 'vscode';
import { commandPrefix } from "../extension";

export function resolveDartExecutable(context: vscode.ExtensionContext): string {
  const fvmSupport = vscode.workspace.getConfiguration().get<boolean>(`${commandPrefix}.fvmSupport`, false);

  if (!fvmSupport) {
    return 'dart';
  }

  const sdk = vscode.workspace.getConfiguration().get<string>(`dart.flutterSdkPath`, '');

  if (sdk.includes('.fvm/versions/')) {
    return 'fvm exec dart';
  }

  const workspaceRoot =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : null;


  if (!workspaceRoot) {
    return 'dart';
  }

  const fvmCfg = path.join(workspaceRoot, '.fvm', 'fvm_config.json');
  if (!existsSync(fvmCfg)) {
    return 'dart';
  }

  return 'fvm exec dart';
}