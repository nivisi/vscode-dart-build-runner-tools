# build_runner VS Code Tools [![marketplace][version-img]][marketplace-url] [![gh][github-img]][github]

Enhance your Dart code generation with VS Code commands, accessible from the file explorer in just two clicks.

## How does it work?

`build_runner` has a parameter called `build-filter` that allows to run code generation on specific files rather than on the whole codebase. This VS Code extension moves this from the terminal to the context menu. Once ran, it collects required files (part directives for **part** commands and selected files for **this** commands) and exectues the `build`/`watch` command in a new terminal window.

### Important note

For `build-filter`, *generated* files must be used, not source files. E.g. if you have a `user.dart` that is used to generate a `user.freezed.dart` class, the freezed class must be used as a parameter.

## Features

### Specific files

- **Build This**: Regenerate the code for specified files, such as a `.g.dart`, directly targeting it with `build_runner`.
- **Watch This**: Continuously monitor and regenerate code for specified files, automatically applying changes as you work.

### Part files

Generated files are often declared using the `part` directive. This "part" command scans for and builds all associated part files within the selected files.

- **Build Parts**: Regenerate the code for `part`s of selected files.
- **Watch Parts**: Continuously monitor and regenerate code for `part`s of specified files, automatically applying changes as you work.

## FAQ

### How do I delete-conflicting-outputs?

If you want to add / remove this flag, you can enable / disable it in the settings of this extension. Or you can open the command palette and run `Enable / Disable delete conflicting outputs` command.

### Can I run this on folders?

Yes, you can run this on both files and folders (multiselect is supported, yes). Speaking of folders, only the `part` type of commands is supported. It checks all the files within a folder (and subfolders), collects the part directives and runs a `build_runner`.

### Can I run this in parallel?

Yes, the command is ran in a new terminal window each time it is executed. Meaning that you can run the `watch` command on the `File A` and then run the `build` command on the `File B`. For your convenience, you can rename terminal windows yourself to not mix them up.


<!-- References -->
[github]: https://github.com/nivisi/vscode-dart-build-runner-tools
[github-img]: https://img.shields.io/badge/GitHub-Source%20Code-181717?logo=github
[version-img]: https://img.shields.io/badge/marketplace-v1.0.0-007ACC?logo=visualstudiocode
[marketplace-url]: https://marketplace.visualstudio.com/items?itemName=nivisi.dart-build-runner-tools