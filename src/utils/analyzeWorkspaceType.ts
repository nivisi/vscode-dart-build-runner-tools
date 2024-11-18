import * as vscode from "vscode";

export async function analyzeWorkspaceType(
    context: vscode.ExtensionContext
): Promise<DartWorkspaceType> {
    const getWorkspaceTypePromise = DartWorkspaceType.parseFrom(context);

    const typePromise = new Promise<DartWorkspaceType>(
        (resolve) => {
            getWorkspaceTypePromise.then((t) => {
                resolve(t);
            }).catch((e) => {
                console.error(e);
                resolve(new DartNoPubspecWorkspaceType());
            });
        }
    );

    context.workspaceState.update("workspaceType", typePromise);

    return typePromise;
}

async function uriToPubspecFile(uri: vscode.Uri): Promise<PubspecFile | undefined> {
    const content = await vscode.workspace.fs.readFile(uri);
    const contentStr = new TextDecoder("utf-8").decode(content);

    const lines = contentStr.split('\n');
    const buildRunnerLine = lines.find(line => line.includes('build_runner:'));
    if (!buildRunnerLine) {
        return undefined;
    }

    const commentIndex = buildRunnerLine.indexOf('#');
    if (commentIndex !== -1) {
        const buildRunnerIndex = buildRunnerLine.indexOf('build_runner');
        if (commentIndex < buildRunnerIndex) {
            return undefined;
        }
    }


    const packageNameMatch = /name: (.+)/.exec(contentStr);
    if (!packageNameMatch) {
        throw Error("No package name found in pubspec");
    }

    const packageName = packageNameMatch[1];
    const workspaceFolderUri = vscode.workspace.getWorkspaceFolder(uri)?.uri;
    if (!workspaceFolderUri) {
        throw Error("No workspace folder found for the given URI");
    }

    const relativeUri = uri.with({ path: uri.path.replace(workspaceFolderUri?.path ?? '', '') });
    return new PubspecFile(
        uri,
        relativeUri,
        packageName,
        relativeUri.fsPath === '/pubspec.yaml'
    );
}


export class DartWorkspaceType {
    static async getFromContext(context: vscode.ExtensionContext): Promise<DartWorkspaceType | undefined> {
        const workspaceType = context.workspaceState.get("workspaceType");
        if (!workspaceType) {
            return undefined;
        }

        return workspaceType;
    }

    static async parseFrom(context: vscode.ExtensionContext): Promise<DartWorkspaceType> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw Error("No workspace folder found");
        }

        const allPubspecs = await findPubspecs();
        const suitablePubspecs = (await Promise.all(allPubspecs.map(uriToPubspecFile))).filter(pubspec => pubspec instanceof PubspecFile) as PubspecFile[];

        if (!suitablePubspecs) {
            return new DartNoPubspecWorkspaceType();
        }

        if (suitablePubspecs.length == 1) {
            const workspaceType = new DartSinglePubspecWorkspaceType(suitablePubspecs[0]);
            return workspaceType;
        }

        if (suitablePubspecs.length > 1) {
            const rootIndex = suitablePubspecs.findIndex(pubspec => pubspec.isRoot);
            if (rootIndex != -1) {
                const rootPubspec = suitablePubspecs[rootIndex];
                suitablePubspecs.splice(rootIndex, 1);
                suitablePubspecs.unshift(rootPubspec);
            }
            const workspaceType = new DartMultiplePubspecsWorkspaceType(suitablePubspecs);
            return workspaceType;
        }

        throw Error("No workspace type found");
    }
}

export class DartNoPubspecWorkspaceType implements DartWorkspaceType { }

export class DartSinglePubspecWorkspaceType implements DartWorkspaceType {
    constructor(
        public readonly pubspec: PubspecFile
    ) { }
}

export class DartMultiplePubspecsWorkspaceType implements DartWorkspaceType {
    constructor(
        public readonly pubspecs: PubspecFile[]
    ) { }
}

export async function findPubspecs() {
    const allPubspecs = await vscode.workspace.findFiles("**/pubspec.yaml");

    return allPubspecs
        .filter(f => !f.fsPath.includes('.symlinks'))
        .filter(f => !f.fsPath.includes('.pub-cache'));
}

export class PubspecFile {
    constructor(
        public readonly fullUri: vscode.Uri,
        public readonly workspaceUri: vscode.Uri,
        public readonly packageName: string,
        public readonly isRoot: boolean
    ) { }
}