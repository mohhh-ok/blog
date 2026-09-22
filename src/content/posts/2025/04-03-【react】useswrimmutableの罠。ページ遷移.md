---
title: "【React】useSWRImmutableの罠。ページ遷移"
pubDate: 2025-04-03
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## useSWRImmutable

useSWRImmutableは、swrライブラリで使える関数です。通常はuseSWRを使いますが、データ更新したくない時などに使用します。

## ページ遷移でも更新されない

以下の事件が発生しました。

*   フォームでデータ更新
*   一覧に戻る
*   もう一度フォームに遷移
*   データが反映されていない

今回、update用のフォーム作成時に、初期データ取得でuseSWRImmutableを使いました。こうすることで、フォーム編集中に意図しないリセットを防ぐ目的です。しかし以下の特徴があるようです。

*   useSWRImmutableは、ページ遷移でも更新されない

## 解決

用途によってはかなり便利です。ただし今回のケースでは困るため、以下のようにして対応しました。

```
const { data, mutate } = useSWRImmutable(...

useEffect(()=>{
  mutate();
}, []);
```

明示的にmutateを呼び出すことで、更新されるようになりました。
