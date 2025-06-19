# Releases

This folder contains packaged `.vsix` files for the Cursor Auto Approve extension.

## Installation

To install any version:

1. Download the desired `.vsix` file
2. Open VS Code or Cursor
3. Open Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
4. Run `Extensions: Install from VSIX...`
5. Select the downloaded `.vsix` file

## Available Versions

- **v2.1.0** - Smart OCR Management and Native Clicking
  - Intelligent OCR triggering with 70-80% performance improvement
  - Cross-platform native mouse clicking
  - Multi-tier detection system
  - Comprehensive testing suite

## Rebuilding Releases

You can always rebuild `.vsix` files from source:

```bash
npm run build
npm run package
```

This will generate a new `.vsix` file in the project root, which you can then move to this folder if needed.

## GitHub Releases

All releases are also available on the [GitHub Releases page](https://github.com/brian-slate/cursor-auto-approve/releases) with detailed release notes and download links.

