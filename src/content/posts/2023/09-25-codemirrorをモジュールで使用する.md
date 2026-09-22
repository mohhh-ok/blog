---
title: "CodeMirrorをモジュールで使用する"
pubDate: 2023-09-25
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

１万行ほどのデータをtextareaに入れていたのですが、動作が重すぎるためCodeMirrorを使用することにしました。仮想スクロールで動作がサクサクになります。

WordPressのプラグインということもあって、できるだけ他のプラグインと干渉しないように、JavaScriptはmoduleでいきたいです。ただCodeMirrorはCDN経由でのmodule使用はバグがあるようです。

[https://gist.github.com/Potherca/028514c75f581db115797ecb50c6f945](https://gist.github.com/Potherca/028514c75f581db115797ecb50c6f945)

上記サイトによると、esm.shで読み込めば問題ないとのこと。そこで、以下のようにしました。フォーム内の全てのテキストエリアをCodeMirrorで置き換え、送信時にはデータをテキストエリアに反映させています。

```javascript

import { basicSetup, EditorView } from 'https://esm.sh/codemirror@6.0.1'

// フォーム要素を取得
const form = document.getElementById('settings-form');

// すべてのtextarea要素を取得
const textareas = form.querySelectorAll('textarea');

textareas.forEach((textarea, index) => {
    // 新しいdiv要素を作成してtextareaの隣に挿入
    const div = document.createElement('div');
    div.classList.add('editor-container');
    textarea.parentNode.insertBefore(div, textarea.nextSibling);

    // CodeMirrorインスタンスを作成
    const editorView = new EditorView({
        doc: textarea.value,
        extensions: [basicSetup],
        parent: div,
    });

    // フォーム送信時に隠しinput要素とCodeMirrorの内容を同期
    form.addEventListener('submit', () => {
        textarea.value = editorView.state.doc.toString();
    });
});


```
