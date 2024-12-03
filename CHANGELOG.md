# Changelog

## 1.2.4

- Use correct path separators when reading / analyzing file system.

## 1.2.3

- Improve error messages.

## 1.2.2

- Fix the bug with part files build-filters being sliced when not needed.

## 1.2.1

- Add logo

## 1.2.0

- Support for non-root projects. The extension now works with workspaces where packages are not located in the root directory.
- Monorepo support. If your workspace contains multiple pubspec.yaml files, you can run code generation on specific projects or across all of them.

## 1.1.1

- Fix deleteConflictingOuputs being non-configurable & ignored.

## 1.1.0

### Introducing build_runner Menu

- Open the build_runner menu by using a default keybinding `ctrl+b` + `ctrl+r`.
- This menu allows you to build/watch part files / this file or run build_runner on the whole workspace.
- It can also be found in the top right of the navigation bar when a `.dart` file is opened.
  
  <img width=600 alt="Menu" src="https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/3b303cba-e5f0-4e1d-83a4-9562ad273635"/>

### Context Menu

- Actions in the context menu are now groupped:
  - build / watch this file,
  - build / watch part files.
- For single files, terminal window is now reused. E.g. we will spawn one terminal per file. For multiple files, we will still spawn multiple terminal windows.

  <img width=400 alt="Context menu" src="https://github.com/nivisi/vscode-dart-build-runner-tools/assets/33932162/767e8620-bc03-4821-bc78-ef9bd6cba749"/>

## 1.0.5

- Downgrade the minimum VS Code version.

## 1.0.4

- Allow to run build / watch this on folders.

## 1.0.3

- Fix multi select issues
- Provide showcase GIFs

## 1.0.2

- README updates

## 1.0.1

- README updates

## 1.0.0

- Initial release
