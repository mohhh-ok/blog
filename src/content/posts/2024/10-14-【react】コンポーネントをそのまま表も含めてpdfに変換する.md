---
title: "【React】コンポーネントをそのまま表も含めてPDFに変換する"
pubDate: 2024-10-14
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## jsPDF

jsPDFは、クライアントサイドでPDFを作成できるライブラリです。

https://github.com/parallax/jsPDF

htmlからも作成できるため、表などが簡単に作れます。

## 参考サイト

以下のサイトを参考にさせていただきました。

https://qiita.com/niyu1103/items/ed4941ddc7689df771dd

## 手順

### フォントをセットアップする

以下より、フォントをjsに変換します。今回はNoto Sans JPを使用しました。

https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html

変換したjsを下記のようにインポートします。

```
import "./NotoSansJP-Regular-normal";
```

これでフォントセットアップ完了です。

### コンポーネントを作る

再利用を考慮して、子要素全てをPDFにする形としました。

```jsx
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Box, Button } from "@mui/material";
import { jsPDF } from "jspdf";
import { useRef } from "react";
import "./NotoSansJP-Regular-normal";

const FONT = "NotoSansJP-Regular";

type Props = {
    children: React.ReactNode;
}

export function PdfContainer(props: Props) {
    const { children } = props;
    const targetRef = useRef<HTMLDivElement>(null);
    const pdfRef = useRef(new jsPDF());

    function getFileName() {
        const timestamp = new Date().getTime();
        return `download_${timestamp}.pdf`;
    };

    function savePdf() {
        if (!targetRef.current) return;
        pdfRef.current.html(targetRef.current, {
            callback(doc) {
                const fileName = getFileName();
                doc.setFont(FONT, "normal");
                doc.setFontSize(12);
                doc.save(fileName);
            },
            x: 15,
            y: 15,
            width: 170,
            windowWidth: 775,
        });
    };

    return <Box sx={{ border: "1px solid #aaa", padding: 2 }}>
        <Button variant="contained" onClick={savePdf}>
            <PictureAsPdfIcon fontSize='small' />
            PDFを保存
        </Button>
        <Box sx={{ '& *': { fontFamily: FONT } }} ref={targetRef}>
            {children}
        </Box>
    </Box>
};
```

### 試してみる

以下のコードで試してみます。ChatGPT出力をそのまま使っているため、重複が半端ないです。実際にはMuiのstyledなどを使ってスリムにできます。

```jsx
export function PdfContainerSample() {
    return <PdfContainer>
        <h1>PDF Container Sample</h1>
        <p>これはPDFコンテナのサンプルです。</p>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
                <tr>
                    <th style={{ border: '1px solid black', padding: '8px' }}>項目</th>
                    <th style={{ border: '1px solid black', padding: '8px' }}>説明</th>
                    <th style={{ border: '1px solid black', padding: '8px' }}>値</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>サンプル1</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>これはサンプル1の説明です。</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>100</td>
                </tr>
                <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>サンプル2</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>これはサンプル2の説明です。</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>200</td>
                </tr>
                <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>サンプル3</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>これはサンプル3の説明です。</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>300</td>
                </tr>
            </tbody>
        </table>
    </PdfContainer>
}
```

結果以下のようになりました。

#### ブラウザ表示

![](http://35.221.87.155/wp-content/uploads/2024/10/スクリーンショット-2024-10-14-3.07.46-1024x354.png)

#### PDF表示

![](http://35.221.87.155/wp-content/uploads/2024/10/スクリーンショット-2024-10-14-3.08.22-1024x319.png)

ちょっとずれてますね。本番では細かな修正が必要そうです。
