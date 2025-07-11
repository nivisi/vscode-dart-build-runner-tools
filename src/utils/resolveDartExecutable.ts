import { existsSync } from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import { commandPrefix } from "../extension";

export function resolveDartExecutable(context: vscode.ExtensionContext): string {
  const fvmSupport = vscode.workspace.getConfiguration().get<string>(`${commandPrefix}.fvmSupport`, 'no-support');

  if (fvmSupport == 'fvm-binary') {
    const sdk = vscode.workspace.getConfiguration().get<string>(`dart.flutterSdkPath`, '');

    if (sdk.includes(`.fvm${path.sep}versions${path.sep}`)) {
      const executableName = process.platform === 'win32' ? 'dart.bat' : 'dart';
      const fvmDartPath = sdk + `${path.sep}bin${path.sep}${executableName}`;

      return fvmDartPath;
    }
  }

  if (fvmSupport === 'fvm-exec') {
    const workspaceRoot =
      vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : null;


    if (!workspaceRoot) {
      return 'dart';
    }

    const fvmCfg = path.join(workspaceRoot, '.fvm', 'fvm_config.json');
    if (existsSync(fvmCfg)) {
      return 'fvm exec dart';
    }

  }

  return 'dart';
}