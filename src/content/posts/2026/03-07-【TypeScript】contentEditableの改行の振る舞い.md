---
title: 【TypeScript】contentEditableの改行の振る舞い
pubDate: 2026-03-07
categories: ["TypeScript"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## contentEditable

`contentEditable` 属性を使うと、任意の HTML 要素をユーザーが編集できるようにできます。

```html
<div contentEditable>ここを編集できます</div>
```

### 改行の問題

contentEditable の要素でEnterキーを押すと、ブラウザ（Chrome）は新しい &lt;div&gt;
要素を生成して改行を表現します。この挙動が innerText
で取得したテキストに意図しない空行を生み出します。


各プロパティの特性をまとめると以下のとおりです。

| プロパティ | 特性 |
| --- | --- |
| `innerText` | 改行が `\n\n`（2つ）になる問題がある |
| `innerHTML` | `<div>` や `<br>` を含む生の HTML |
| `textContent` | 改行が失われ、テキストが連結される |

## ブラウザによる挙動の違い

Enter キー押下時の挙動はブラウザによって異なります。以下はAIによるまとめですが、いったんこれで進めます。（chromium覇権を考えるとおそらくほぼ問題ない）

| ブラウザ | Enter時の生成要素 | innerText の改行 |
| --- | --- | --- |
| Chrome / Edge | `<div>新行</div>` | `\n\n`（2つ） |
| Firefox（旧） | `<br>` | `\n`（1つ） |
| Firefox（新・約60以降） | `<div>` に移行済み | `\n\n`（2つ） |
| Safari | `<div>新行</div>` | `\n\n`（2つ） |

現代ブラウザはほぼ Chrome と同じ挙動に収束しているため、対応は１パターンで良さそうです。

## 余計な改行を除去する関数

innerHTMLかinnerTextのどちらかを調整することになります。innerHTMLは表示制御で使う可能性があるため、今回はinnerTextを使用することにしました。下記のようにします。

```ts
/**
 * contentEditable の innerText は、Enterで改行すると <div> 境界が \n\n になる問題がある。
 * この関数は連続する \n\n を \n に正規化し、末尾の余分な \n を除去する。
 */
export function fixInnerText(innerText: string): string {
  return innerText.replace(/\n\n/g, "\n").replace(/\n$/, "");
}
```


## 結果

innerText, innerHTML, textContent, fixed (fixInnerText使用)の結果は以下のようになります。fixedで正常に修正できることが確認できました。なおChromeでテストしています。

| # | innerText | innerHTML | textContent | fixed |
| --- | --- | --- | --- | --- |
| 1 | "\n" | &lt;br&gt; | "" | "" |
| 2 | "一行目" | 一行目 | "一行目" | "一行目" |
| 3 | "一行目\n二行目" | 一行目&lt;div&gt;二行目&lt;/div&gt; | "一行目二行目" | "一行目\n二行目" |
| 4 | "一行目\n二行目\n三行目" | 一行目&lt;div&gt;二行目&lt;/div&gt;&lt;div&gt;三行目&lt;/div&gt; | "一行目二行目三行目" | "一行目\n二行目\n三行目" |
| 5 | "一行目\n\n\n三行目" | 一行目&lt;div&gt;&lt;br&gt;&lt;/div&gt;&lt;div&gt;三行目&lt;/div&gt; | "一行目三行目" | "一行目\n\n三行目" |
| 6 | "一行目\n\n\n\n\n四行目" | 一行目&lt;div&gt;&lt;br&gt;&lt;/div&gt;&lt;div&gt;&lt;br&gt;&lt;/div&gt;&lt;div&gt;四行目&lt;/div&gt; | "一行目四行目" | "一行目\n\n\n四行目" |

## コード

今回使用したコードは以下になります。AIに作成してもらいました。

```tsx
import { useRef, useState } from "react";

type Entry = {
  id: number;
  innerText: string;
  innerHTML: string;
  textContent: string;
  fixed: string;
};

const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "4px 8px",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "4px 8px",
  verticalAlign: "top",
  wordBreak: "break-all",
};

function fixInnerText(innerText: string): string {
  return innerText.replace(/\n\n/g, "\n").replace(/\n$/, "");
}

const escapeHtml = (str: string): string => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toMarkdown = (history: Entry[]): string => {
  const header = "| # | innerText | innerHTML | textContent | fixed |";
  const sep = "| --- | --- | --- | --- | --- |";
  const rows = history.map(
    (e) => `| ${e.id} | ${e.innerText} | ${escapeHtml(JSON.parse(e.innerHTML))} | ${e.textContent} | ${e.fixed} |`,
  );
  return [header, sep, ...rows].join("\n");
};

const App = () => {
  const [history, setHistory] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  const handleSave = () => {
    const el = divRef.current;
    if (!el) return;
    counter.current += 1;
    setHistory((prev) => [
      ...prev,
      {
        id: counter.current,
        innerText: JSON.stringify(el.innerText),
        innerHTML: JSON.stringify(el.innerHTML),
        textContent: JSON.stringify(el.textContent),
        fixed: JSON.stringify(fixInnerText(el.innerText)),
      },
    ]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(toMarkdown(history)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: "16px", fontFamily: "monospace" }}>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          border: "1px solid #ccc",
          padding: "8px",
          minHeight: "100px",
          marginBottom: "8px",
        }}
      >
        ここを編集してください
      </div>

      <button onClick={handleSave}>保存</button>

      {history.length > 0 && (
        <>
          <div style={{ marginTop: "24px" }}>
            <strong>履歴</strong>
            <table style={{ marginTop: "8px", borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>innerText</th>
                  <th style={thStyle}>innerHTML</th>
                  <th style={thStyle}>textContent</th>
                  <th style={thStyle}>fixed</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td style={tdStyle}>{entry.id}</td>
                    <td style={tdStyle}>{entry.innerText}</td>
                    <td style={tdStyle}>{entry.innerHTML}</td>
                    <td style={tdStyle}>{entry.textContent}</td>
                    <td style={tdStyle}>{entry.fixed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "24px" }}>
            <strong>Markdown出力</strong>
            <button onClick={handleCopy} style={{ marginLeft: "8px" }}>
              {copied ? "コピーした！" : "コピー"}
            </button>
            <pre style={{ marginTop: "8px", padding: "8px", border: "1px solid #ccc" }}>
              {toMarkdown(history)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
```
