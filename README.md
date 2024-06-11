# build_runner VS Code Tools [![marketplace][version-img]][marketplace-url] [![gh][github-img]][github]

Bring [`build_runner`](https://pub.dev/packages/build_runner) to your context menu. Shorten code generation times by building / watching specific files instead of the whole codebase in just two clicks.

![vscode_showcase_part](https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/d8d3b376-fb47-462b-b6ca-f387dc84a2c8)

## Features

### Menu

You can quickly run `build_runner` on either the whole workspace or on the active file through a build_runner menu. Open it by using a predefined keybinding `ctrl+B` + `ctrl+R`:

<img width=600 alt="Menu" src="https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/3b303cba-e5f0-4e1d-83a4-9562ad273635"/>

### File context menu

If you want to run `build_runner` on a specific file, e.g. `user.g.dart`, simply right click the file and select the command you need, **Build This** / **Watch This**.

- **Build This**: Regenerate the code for specified files directly targeting it with `build_runner`.
- **Watch This**: Continuously monitor and regenerate code for specified files, automatically applying changes as you work.

You can also run `build_runner` on part files. No, there's don't need to multiselect all the files: the extension will do it for you. Just select the main file, such as `user.dart`, and the extension will gather all the associated part files, like `user.freezed.dart` and `user.g.dart`, and will run the command on those files.

- **Build Parts**: Regenerate the code for `part`s of selected files.
- **Watch Parts**: Continuously monitor and regenerate code for `part`s of specified files, automatically applying changes as you work.

<img width=400 alt="Context menu" src="https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/767e8620-bc03-4821-bc78-ef9bd6cba749"/>

## How does it work?

`build_runner` has a parameter `build-filter` that allows to specify which files to include for code generation.

```bash
dart build_runner build --build-filter=lib/user.g.dart
```

...and instead of regenerating the whole codebase, it will only regenerate `lib/user.g.dart`. Although running this command with terminal is not always convenient (especially if you want to run it on multiple files). This VS Code extension puts this command to your context menu. So just right click the needed files, select the required command and you're covered.

Once ran, it collects required files (part directives for **part** commands and selected files for **this** commands) and exectues the `build`/`watch` command in a new terminal window.

**Important**: *Generated* files must be used, not *source* files. E.g. if you have a **user.dart** that is used to generate **user.freezed.dart** class, the freezed class must be used as a parameter.

## FAQ

### How do I delete-conflicting-outputs?

If you want to add / remove this flag, you can enable / disable it in the settings of this extension. Or you can open the command palette and run `Enable / Disable delete conflicting outputs` command.

### Can I run this on folders?

Yes, you can run this on both files and folders. Speaking of folders, only the `part` type of commands is supported. It checks all the files within a folder (and subfolders), collects the part directives and runs a `build_runner`.

![vscode_showcase_folder](https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/ccbe55e7-8310-466e-a0d3-8cf63e28f1b8)

### Is multiselect supported?

Yes, you can run this command on multiple files / folders at once.

![vscode_showcase_multiselect](https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/a6c8eb75-1a32-4a8e-a3a6-aed04e2f0159)

### Can I run this in parallel?

Yes, the command is ran in a new terminal window each time it is executed. Meaning that you can run the `watch` command on the `File A` and then run the `build` command on the `File B`. For your convenience, you can rename terminal windows yourself to not mix them up.

![vscode_showcase_parallel](https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/ff72eee9-a2b2-466a-8ce2-94c7d7f297e7)

<!-- References -->

[github]: https://github.com/nivisi/vscode-dart-build-runner-tools
[github-img]: https://img.shields.io/badge/GitHub-Source%20Code-181717?logo=github
[version-img]: https://img.shields.io/badge/marketplace-v1.1.1-007ACC?logo=visualstudiocode
[marketplace-url]: https://marketplace.visualstudio.com/items?itemName=nivisi.dart-build-runner-tools
