---
title: "【AgGrid】任意のレコードを常に最下部に固定する【React】"
pubDate: 2025-03-21
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## AgGridReactのソート

AgGridReactでは、フィールドごとのソート機能があります。とても便利ですが、任意のレコードを常に上部あるいは下部に表示させたいときに、工夫が必要です。

AgGridReactによるソートから、さらに調整するにはpostSortRowsを使用します。

例えばidを持たないアイテムを最下部に表示するには、以下のようにします。

```jsx
<AgGridReact
  postSortRows={(params) => {
    let rowNodes = params.nodes;
    let nextInsertPos = 0;
    for (let i = 0; i < rowNodes.length; i++) {
      const id = rowNodes[i].data[props.idColName];
      // idを持つレコードなら上部に配置
      if (id) {
        rowNodes.splice(nextInsertPos, 0, rowNodes.splice(i, 1)[0]);
        nextInsertPos++;
      }
    };
  }
/>
```

単純にsort関数を使うと、他のフィールドのソートが無効となってしまうため、何やら複雑なコードになっています。
