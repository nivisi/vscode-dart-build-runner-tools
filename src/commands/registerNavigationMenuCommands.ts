
import { basename } from 'path';
import * as vscode from 'vscode';
import { commandPrefix } from '../extension';

export function registerNavigationMenuCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.openMenu`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = activeEditor?.document.uri;

        var commandsMapped: { [label: string]: string; } = {};

        commandsMapped['Build'] = 'buildWorkspace';
        commandsMapped['Watch'] = 'watchWorkspace';
        commandsMapped['Build This File'] = 'buildThisFile';
        commandsMapped['Watch This File'] = 'watchThisFile';
        commandsMapped['Build Part Files'] = 'buildPartFiles';
        commandsMapped['Watch Part Files'] = 'watchPartFiles';

        const quickPickItems: vscode.QuickPickItem[] = [

        ];

        if (fileUri) {
            const fileBasename = basename(fileUri.toString());
            if (fileBasename.endsWith('.dart')) {
                const countDots = (fileBasename.match(/\./g) || []).length;
                const isPartAlready = countDots > 1;

                if (isPartAlready) {
                    quickPickItems.push(...[
                        {
                            label: 'This File',
                            kind: vscode.QuickPickItemKind.Separator,
                        },
                        {
                            label: 'Build This File',
                            description: `${fileBasename}`,
                            detail: "Runs build_runner build on the currenly selected file",
                            iconPath: new vscode.ThemeIcon('tools'),
                            picked: true,
                        },
                        {
                            label: 'Watch This File',
                            description: `${fileBasename}`,
                            detail: "Runs build_runner watch on the currenly selected file",
                            iconPath: new vscode.ThemeIcon('eye')
                        }
                    ]);
                }

                if (!isPartAlready) {
                    quickPickItems.push(
                        ...[
                            {
                                label: 'Part Files',
                                kind: vscode.QuickPickItemKind.Separator,
                            },
                            {
                                label: 'Build Part Files',
                                description: `of ${fileBasename}`,
                                detail: "Runs build_runner build on the parts of the currently selected file",
                                iconPath: new vscode.ThemeIcon('tools'),
                                picked: true,
                            },
                            {
                                label: 'Watch Part Files',
                                description: `of ${fileBasename}`,
                                detail: "Runs build_runner watch on the parts of the currently selected file",
                                iconPath: new vscode.ThemeIcon('eye')
                            }
                        ]
                    );
                }
            }
        }

        quickPickItems.push(
            ...[
                {
                    label: 'Workspace',
                    kind: vscode.QuickPickItemKind.Separator,
                },
                {
                    label: 'Build',
                    description: vscode.workspace.name,
                    detail: 'Runs build_runner build in the workspace',
                    iconPath: new vscode.ThemeIcon('tools'),
                },
                {
                    label: 'Watch',
                    description: vscode.workspace.name,
                    detail: 'Runs build_runner watch in the workspace',
                    iconPath: new vscode.ThemeIcon('eye')
                },
            ]
        );

        const selected = await vscode.window.showQuickPick(
            quickPickItems,
            {
                title: 'build_runner Tools',
                placeHolder: 'Select an action',
            },
        );

        const label = selected?.label;
        if (!label) {
            return;
        }

        const id = commandsMapped[label];

        if (!id) {
            return;
        }

        vscode.commands.executeCommand(`${commandPrefix}.${id}`, fileUri);
    }));
}