---
title: "【dnd kit】MUIとの組み合わせでドラッグできない問題"
pubDate: 2024-01-11
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## dnd kit

dnd kitはドラッグ&ドロップを簡単に実装できるライブラリです。ソートもできるようですので、導入しました。

https://dndkit.com/

## MUIと組み合わせた不具合

当該githubのissuesにも投稿したのですが、修正がいつになるかわからないためここでも共有させていただきます。解決方法もあります。

具体的には、MUIのGrid containerと一緒に使うとドラッグできなくなるという問題です。以下に検証用コードを載せます。なお切り分けていないため、現在進めているプロジェクトに依存する部分もあるかもしれません。

```jsx
import React from 'react';
import { DndContext, useDraggable } from '@dnd-kit/core';
import { Box, Grid } from '@mui/material';

const DND_ID = "dndTest";

function Draggable(props: { children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: DND_ID,
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

export function DraggableTest() {
    return <>
        <h1>Drag test</h1>
        <DndContext>
            <Draggable>Can drag</Draggable>
        </DndContext>
        <br />

        <DndContext>
            <Draggable>Can not drag</Draggable>
        </DndContext>
        <br />

        <Grid container spacing={2}>
            <Grid item xs={12}>This grid may the cause</Grid>
        </Grid>

        <DndContext>
            <Draggable>Can not drag</Draggable>
        </DndContext>
        <Box>
            <Grid container spacing={2}>
                <Grid item xs={12}>Wrapping with Box does not resolve the problem.</Grid>
            </Grid>
        </Box>

        <DndContext>
            <Draggable>Can drag</Draggable>
        </DndContext>
        <br /><br />
        <Grid container spacing={2}>
            <Grid item xs={12}>This grid is safe under two line breaks.</Grid>
        </Grid>


    </>
}
```

上記コードを使用すると、ドラッグできるボタンとできないボタンが生成されます。

![](http://35.221.87.155/wp-content/uploads/2024/01/スクリーンショット-2024-01-11-13.40.37.png)

できないものは、Grid containerの上に載っている部分です。ただし<br/><br/>にGrid containerを続けた場合はドラッグできます。おそらくGrid containerの描画とdnd kitと相性が悪いようです。ひとまず<br/><br/>を使用することで対応できそうです。

## 小話

最近またたまごご飯にハマりだしました。丼ご飯にたまご２つ、それにリカーマウンテンで買ってきた美味しい刻み海苔と、塩を少々振るだけで絶品です。
