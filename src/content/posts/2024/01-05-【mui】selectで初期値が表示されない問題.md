---
title: "【MUI】Selectで初期値が表示されない問題"
pubDate: 2024-01-05
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## MUI Selectで初期値が表示されない問題

今回、このような問題に直面しました。MUIのSelectで初期値がなぜか表示されないというものです。

```jsx
<Select
    value={details?.currency}
    onChange={e => setDetailsWithKeyValue("currency", e.target.value)}
>
    {CURRENCIES.map(c =>
        <MenuItem key={c} value={c}>{c}</MenuItem>
    )}
</Select>
```

これでdetails?.currencyの初期値が選択状態になるはずなのですが、なぜか何も選択されていない状態で表示されます。クリックして別の何かを選択すると正常に表示されるのですが、再読み込みすると再び何も選択されていない状態に。

## undefined時に文字列が入るようにして解決

結論、以下のようにすれば意図通り表示されるようになました。

```jsx
value={details?.currency || ''}
```

## 小話

先日友人とコーヒーの話になりまして、手入れでドリップコーヒーを入れてくれるという隠れ家的なお店に行ってきました。Googleで確認すると、営業時間は記載なし。年初めの嵐山、大勢の観光客の中を友人の運転で到着すると、見事に休業中。。。嵐山の風景を見ながら帰路に着きました。
