---
title: "【MUI】Selectコンポーネントで空文字列をデフォルトにする"
pubDate: 2025-02-21
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## MUI Selectのデフォルト値

MUIのSelectでのMenuItemに、nullは使用できません。

```
<Select value={null}>
  <MenuItem value={null}>選択してください</MenuItem>
  // エラーになる
```

ならばと空文字を渡してみると、表示上、選択されていないことになってしまいます。

```
<Select value=''>
  <MenuItem value=''>選択してください</MenuItem>
  // 何も選択状態にならない
```

それならと、以下のように任意の文字を使用する方法があります。

```
<Select value='-'>
  <MenuItem value='-'>選択してください</MenuItem>
  // 「選択してください」が選択される
```

ただこうすると、実際に使用するリスト以外の値となるため、周りの処理が複雑化してしまいます。しかしnullは渡せない。。。

## 空文字列を扱えるようにする

次善策として、displayEmptyを指定すれば、空文字列でも選択状態にすることができます。

```
<Select value='' displayEmpty>
  <MenuItem value=''>選択してください</MenuItem>
  // 「選択してください」が選択される
```

これで、かなりコードをシンプルにできるようになりました。
