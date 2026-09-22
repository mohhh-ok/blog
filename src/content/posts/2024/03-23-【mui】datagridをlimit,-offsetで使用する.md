---
title: "【MUI】DataGridをlimit, offsetで使用する"
pubDate: 2024-03-23
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## MUI DataGridのpagination

DataGridのpaginationは、0から始まる値が採用されており、プログラマーに親和性のある仕様となっています。余談ですが、同じMUIのPagenationでは、1から始まる仕様になっているため、混乱は避けられません。

ただ0から始まるとはいえ、DataGridはpage, pageSizeが使用されています。データベース操作は基本的にはlimit, offsetですので、少し頭を回さないといけません。１度や２度ならいいのですが、何度もDataGridを使用する機会があると、paginationのためだけにここで無駄な時間を割くのは得策ではありません。そこで、ここにメモを残すことにしました。

## DataGridをlimit, offsetで使用する

具体的には、以下のようになります。

```jsx
"use client"

import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

type RowType = {
    id: number,
}

const ALL_ROWS: RowType[] = [...Array(1000)].map((_, index) => ({ id: index }))
const DEFAULT_LIMIT = 10;

const columns: GridColDef<RowType>[] = [
    { field: 'id', headerName: 'ID', width: 200 },
]

export default function TestPage() {
    const [limit, setLimit] = useState(DEFAULT_LIMIT)
    const [offset, setOffset] = useState(0)
    const [rows, setRows] = useState<RowType[]>([])

    useEffect(() => {
        const newRows = ALL_ROWS.slice(offset, offset + limit)
        setRows(newRows)
    }, [limit, offset]);

    return <DataGrid
        rows={rows}
        columns={columns}
        paginationMode='server'
        onPaginationModelChange={({ page, pageSize }) => {
            setLimit(pageSize)
            setOffset(page * pageSize)
        }}
        paginationModel={{
            pageSize: limit,
            page: offset / limit
        }}
        rowCount={ALL_ROWS.length}
        pageSizeOptions={[5, 10, 50, 100]} // デフォルトリミットを含める必要がある
    />
}
```

これが、limit, offsetでDataGridを運用する最低限のコードとなります。

## 余談

今はAIが発展してきていますが、プログラマーはいつ仕事を奪われるでしょう。まだしばらくは大丈夫でしょうか。GPT5が出てくると、ちょっとしたアプリなら知識がなくても作れるようになるかもしれませんね。ただ、音楽に関してはまだまだですね。はい（ドヤ）
