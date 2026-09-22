---
title: "【Chart.js】aspectRatioの動的設定がうまくいかなかった話"
pubDate: 2023-10-10
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

世の中にはChart.jsなんていう素晴らしいライブラリを無償で提供してくださっている方がおられるんですね。

そのChart.jsでうまくいかなかった話と、解決方法を書かせていただきます。

## aspectRatioの動的変更

aspectRatioを設定すれば、チャート全体の縦横比を変えることができます。

```javascript
this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timestamps,
                datasets,
            },
            options: {
                aspectRatio: 2.0, // <- ここ
```

で、これを動的に変更するために、以下のようにしてたんですね。

```javascript
this.chartInstance.options.aspectRatio = 1.0;
```

するとなぜか、横幅いっぱいに広がらず、隣がスカスカになるんですよ。cssではwidth100%を設定してるのに構わずです。

## 解決方法

どうやら、最初に設定したaspectRatioと、次に設定する値との関係で、そのような状況になるみたいです。

たとえば最初は1.0にしておいて（縦長）、そこから動的に2.0（横長）に設定するとうまくいきました。

最近寒くなってきましたね。夏が恋しいです。ではでは。
