---
title: "【Zed】Cursorから乗り換えてみての初感"
pubDate: 2025-10-18
categories: ["開発"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## Zed editor

Zed editorはRust製の高速なエディタです。Atomというエディタの元開発者によるもので、次世代エディタを謳っています。

もともとAtomはGithubによって開発されていました。MicrosoftがGithubを買収したことによりVSCode一本となり、Atomの開発が終了。その後Atomの元開発者たちが立ち上がり、次世代のエディタを作ろうとなったそうです。

VSCodeはElectronで作成されており重いのが欠点です。しかし高機能であるため2025年10月18日現在ほぼスタンダードとして愛用されています。そこへZed editorが切り崩しをかけている状態です。

ZedはRustで書かれており、とても高速なのが特徴です。

## 解説動画

情報の灯台さんが解説されています。これでzedの存在を知りました。

https://www.youtube.com/watch?v=I6tV8zyjzy0

## Zedを使ってみた。

[https://zed.dev](https://zed.dev)

起動時にcursorからの乗り換えプロセスを走らせられます。その後実際に数時間ほど使ってみましたが、かなり良さげな印象です。

今の所、Next.jsでの開発において、追加設定なしでも下記のような機能が確認できました。

*   HTML開始タグ編集時に終了タグも自動置換
*   自動フォーマット
*   Github便利パネル

調べてみた所、すでにHTML拡張が入っていました。フォーマットについては、自動でprettierのような挙動をするようです。これは後日、dprintに乗り換えました。

### Ligatureがデフォルトで有効

これはZedを使うまで知りませんでした。>=といった表記を重ねて表示できるようです。VSCodeだとデフォルトで無効ですがZedでは有効なため、気づけたようです。これはかなり熱いです。

Zedでは追加の設定は不要ですが、VSCodeでは下記のようにしてできるみたいです。

[https://qiita.com/gehnmai/items/1b6593660e1e3ee9bcae](https://qiita.com/gehnmai/items/1b6593660e1e3ee9bcae)

### AI

AI機能については、APIキーを入力します。主要なProviderに加え、色々あるようです。GPT5はOpenAIでOrganizationの認証が必要です。私はなぜかID認証に失敗し、問い合わせてみたものの解決せずひとまずClaudeでやることにしました。必要に応じてCursorを併用しようと思います。

### MacでのCompletionショートカットを調整

MacではCtrl + Spaceが英語/日本語切り替えに割り当てられている関係から、Completionが使えません。そのためZedの方でCompletionのショートカットを変更します。

```
Zed => Setting => Open Keymap
```

からeditor: show completionsを選択します。Ctrl + Spaceとなっているため、例えば以下のキーを割り当てます。

```
Cmd + Space
```

## まとめ

数日は使わないとはっきりとは言えませんが、かなり良いです。

今の所はNext.jsプロジェクトだけでしか試していませんので、今後色々みていきたいと思います。ちょっとしたことはこのページに追記していきたいと思います。軽さは正義、Zedが今後伸びていくのは確実です。
