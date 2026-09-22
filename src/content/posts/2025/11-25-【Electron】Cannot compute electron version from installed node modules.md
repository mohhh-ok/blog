---
title: 【Electron】モノレポでCannot compute electron version from installed node modules
pubDate: 2025-11-25
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアのmohです。

Yarn WorkspaceモノレポでElectronビルド時にエラーが出たので、その解決方法について紹介します。

## 環境

Yarn Workspaceのモノレポ構成で以下のバージョンを使用していました。

- yarn: 4.9.2
- electron: ^38.2.2
- electron-builder: 26.1.0
- electron-vite: ^4.0.1

## エラー内容

`electron-builder`でElectronアプリケーションをビルドしようとしたところ、下記のエラーが発生しました。

```
⨯ Cannot compute electron version from installed node modules - none of the possible electron modules are installed and version ("^38.2.2") is not fixed in project.
See https://github.com/electron-userland/electron-builder/issues/3984#issuecomment-504968246
```

エラーメッセージから、electron-builderがnode_modulesからElectronのバージョンを判定できていないことが分かります。

## 原因

明確な原因は特定できませんでしたが、以下の要因が考えられます:

1. **モノレポ構成によるnode_modulesの解決問題**: Yarn Workspacesでは依存関係がルートまたはワークスペース固有のnode_modulesに配置されるため、electron-builderがElectronモジュールを見つけられなかった可能性があります。

2. **セマンティックバージョニング(`^`)の使用**: package.jsonで`^38.2.2`のように指定していたことから、前述の原因と相まって、electron-builderが「固定されたバージョン」として認識できなかった可能性があります。

## 解決方法

以下の2つの対応で解決しました。

## 1. electron-builder.yamlの修正

`electron-builder.yaml`に古いバージョン指定が残っていたため、これをコメントアウトしました。

```yaml
# electronVersion: 31.0.2
```

なおこの指定はオプショナルで、もともと指定する必要はないようです。ただし、この対応だけでは問題は解決しませんでした。

## 2. package.jsonでバージョンを固定

最終的に、`package.json`でElectronのバージョンを完全に固定することで解決しました。

**変更前:**
```json
{
  "devDependencies": {
    "electron": "^38.2.2"
  }
}
```

**変更後:**
```json
{
  "devDependencies": {
    "electron": "38.2.2"
  }
}
```

バージョン番号の前の`^`を削除し固定することで、electron-builderが確実にバージョンを認識できるようになりました。
