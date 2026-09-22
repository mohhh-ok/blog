---
title: "【dnd-kit】DndContextを入れ子にすると、親には伝わらない"
pubDate: 2024-01-30
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## dnd-kit

dnd-kitは、ドラッグ&ドロップを簡単に実装できるライブラリです。

https://docs.dndkit.com/

## Contextを入れ子にすると、親には伝わらない

公式でも入れ子にする事ができると紹介されているのですが、実は親にはイベントが伝わりません。以下は公式コードを少しだけ変更したものです。Contextを入れ子にしています。handleStart2は発火するのですが、handleStart1は発火しません。

```typescript
"use client"

import React from 'react';
import { DndContext } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';


export default function DndTest() {
    function handleStart1() {
        console.log('drag start 1'); // 発火しない
    }
    function handleStart2() {
        console.log('drag start 2'); // 発火する
    }
    return (
        <DndContext onDragStart={handleStart1}>
            <DndContext onDragStart={handleStart2}>
                <Draggable >draggable</Draggable>
            </DndContext>
        </DndContext>
    )
}

function Draggable(props: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: 'draggable',
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;


    return (
        <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {props.children}
        </button>
    );
}
```

これはより厳密な設計を想定したものと思われますが、これを知らないと逆に痛い目を見ます。。。つまり何かの用途でcontextで囲ったコンテナは、それを超えて他コンテナへのドラッグができないということです。そのため、基本は１つのcontextで賄い、完全に独立している場合はそれぞれでcontextを１つずつ使うといった運用になるかと思います。

というわけで、dnd-kitの挙動についてのお話でした。

## 小話

クラフトビールっていうのを一度飲んでみたいです。クラフトボスは好きでよく買うのですが、クラフトビールは未経験です。
