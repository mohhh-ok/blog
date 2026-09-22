---
title: "【GitHub Actions】Windows Flutterをビルドする"
pubDate: 2025-01-04
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Flutterのクロスプラットフォーム

Flutterは、デスクトップやモバイルに対応した、クロスプラットフォーム開発フレームワークです。ただビルドは対応した環境で行わないといけません。Electronといった、どこでもビルドできるようなものとは違うため、方法を考える必要があります。

## GitHub ActionsでWindowsビルドする

今回、以下のディレクトリ構成になっています。image\_converterにflutterプロジェクトが格納されています。

```
/
  - apps
    - image_converter
```

以下のようにして、GitHub Actionsでビルドできます。手動での起動となっています。ビルド後の成果物は、アーティファクトからダウンロードできます。

```yaml
name: Windows Build

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    defaults:
      run:
        working-directory: apps/image_converter
    steps:
    - uses: actions/checkout@v4
    - uses: subosito/flutter-action@v2
      with:
        channel: 'stable'
        architecture: x64
    - run: flutter config --enable-windows-desktop
    - run: flutter build windows --release
    - run: dir build/windows/x64/runner/Release
    - uses: actions/upload-artifact@v4
      with:
        name: windows-build
        path: ${{ github.workspace }}/apps/image_converter/build/windows/x64/runner/Release
```
