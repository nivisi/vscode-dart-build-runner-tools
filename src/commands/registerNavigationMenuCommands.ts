
import * as path from 'path';
import * as vscode from 'vscode';
import { commandPrefix } from '../extension';
import { DartMultiplePubspecsWorkspaceType, DartNoPubspecWorkspaceType, DartSinglePubspecWorkspaceType, DartWorkspaceType } from '../utils/analyzeWorkspaceType';

export async function registerNavigationMenuCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand(`${commandPrefix}.openMenu`, async (file?: vscode.Uri, selectedFiles?: vscode.Uri[]) => {
        const workspaceType = await DartWorkspaceType.getFromContext(context);
        if (!workspaceType) {
            throw Error("No workspace type found");
        }

        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = activeEditor?.document.uri;

        var commandsMapped: { [label: string]: string; } = {};

        commandsMapped['Build'] = 'buildWorkspace';
        commandsMapped['Watch'] = 'watchWorkspace';
        commandsMapped['Build This File'] = 'buildThisFile';
        commandsMapped['Watch This File'] = 'watchThisFile';
        commandsMapped['Build Part Files'] = 'buildPartFiles';
        commandsMapped['Watch Part Files'] = 'watchPartFiles';

        const quickPickItems: vscode.QuickPickItem[] = [];

        if (fileUri) {
            const fileBasename = path.basename(fileUri.toString());
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
                            detail: "Runs build_runner build on the selected file",
                            iconPath: new vscode.ThemeIcon('tools'),
                            picked: true,
                        },
                        {
                            label: 'Watch This File',
                            description: `${fileBasename}`,
                            detail: "Runs build_runner watch on the selected file",
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
                                detail: "Runs build_runner build on the parts of the selected file",
                                iconPath: new vscode.ThemeIcon('tools'),
                                picked: true,
                            },
                            {
                                label: 'Watch Part Files',
                                description: `of ${fileBasename}`,
                                detail: "Runs build_runner watch on the parts of the selected file",
                                iconPath: new vscode.ThemeIcon('eye')
                            }
                        ]
                    );
                }
            }
        }

        switch (workspaceType.constructor) {
            case DartNoPubspecWorkspaceType:
                break;
            case DartSinglePubspecWorkspaceType:
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
                break;
            case DartMultiplePubspecsWorkspaceType:
                const multi = workspaceType as DartMultiplePubspecsWorkspaceType;

                var pubspecs = multi.pubspecs;

                const root = multi.pubspecs.find(pubspec => pubspec.isRoot);
                if (root) {
                    pubspecs = pubspecs.filter(pubspec => pubspec !== root);

                    quickPickItems.push(
                        {
                            label: root.packageName,
                            kind: vscode.QuickPickItemKind.Separator,
                        },
                        {
                            label: `Build ${root.packageName}`,
                            description: root.workspaceUri.fsPath.replace(`${path.sep}pubspec.yaml`, ''),
                            detail: `build_runner build ${root.packageName}`,
                            iconPath: new vscode.ThemeIcon('tools'),
                        },
                        {
                            label: `Watch ${root.packageName}`,
                            description: root.workspaceUri.fsPath.replace(`${path.sep}pubspec.yaml`, ''),
                            detail: `build_runner watch ${root.packageName}`,
                            iconPath: new vscode.ThemeIcon('eye')
                        }
                    );
                }

                quickPickItems.push(
                    {
                        label: 'All',
                        kind: vscode.QuickPickItemKind.Separator,
                    },
                    {
                        label: `Build All`,
                        detail: 'Runs code generation for all packages in the workspace',
                        iconPath: new vscode.ThemeIcon('tools'),
                    },
                    {
                        label: `Watch All`,
                        detail: 'Runs code generation for all packages in the workspace',
                        iconPath: new vscode.ThemeIcon('eye')
                    }
                );

                for (const pubspec of pubspecs) {
                    quickPickItems.push(
                        {
                            label: pubspec.packageName,
                            kind: vscode.QuickPickItemKind.Separator,
                        },
                        {
                            label: `Build ${pubspec.packageName}`,
                            description: pubspec.workspaceUri.fsPath.replace(`${path.sep}pubspec.yaml`, ''),
                            detail: `build_runner build ${pubspec.packageName}`,
                            iconPath: new vscode.ThemeIcon('tools'),
                        },
                        {
                            label: `Watch ${pubspec.packageName}`,
                            description: pubspec.workspaceUri.fsPath.replace(`${path.sep}pubspec.yaml`, ''),
                            detail: `build_runner watch ${pubspec.packageName}`,
                            iconPath: new vscode.ThemeIcon('eye')
                        }
                    );
                }
                break;
            default:
                break;
        }

        const selected = await vscode.window.showQuickPick(
            quickPickItems,
            {
                title: 'build_runner Tools',
                placeHolder: 'Select an action',
            },
        );

        var label: string | undefined = undefined;
        label = selected?.label;
        if (!label) {
            return;
        }

        const rawCommand = commandsMapped[label];
        if (rawCommand) {
            /// Meaning we're building / watching a single file.
            vscode.commands.executeCommand(`${commandPrefix}.${rawCommand}`, fileUri);
            return;
        }

        const splitBySpace = label.split(' ');
        if (splitBySpace.length < 2) {
            vscode.window.showErrorMessage(`Command not found for label: ${label}`);
            return;
        }

        const runOn = splitBySpace[1];
        label = splitBySpace[0];

        if (runOn == 'All') {
            const command = commandsMapped[label];
            for (const pubspec of (workspaceType as DartMultiplePubspecsWorkspaceType).pubspecs) {
                vscode.commands.executeCommand(`${commandPrefix}.${command}`, pubspec);
            }

            return;
        }

        var id = commandsMapped[label];
        if (!id) {
            vscode.window.showErrorMessage(`Command not found for label: ${label}`);
            return;
        }

        /// Now we need to execute the command with the right pubspec file.
        /// TODO: Allow to multi select in the future.
        switch (workspaceType.constructor) {
            case DartNoPubspecWorkspaceType:
                /* Nothing to do */
                break;
            case DartSinglePubspecWorkspaceType:
                const singleWorkspace = workspaceType as DartSinglePubspecWorkspaceType;
                vscode.commands.executeCommand(`${commandPrefix}.${id}`, singleWorkspace.pubspec);

                break;
            case DartMultiplePubspecsWorkspaceType:
                const description = (selected?.description ?? '') + `${path.sep}pubspec.yaml`;

                const multiWorkspace = workspaceType as DartMultiplePubspecsWorkspaceType;
                const selectedPubspec = multiWorkspace.pubspecs.find(pubspec => pubspec.workspaceUri.fsPath === description);
                if (selectedPubspec) {
                    vscode.commands.executeCommand(`${commandPrefix}.${id}`, selectedPubspec);
                }

                break;
            default:
                break;
        }
    }));
}