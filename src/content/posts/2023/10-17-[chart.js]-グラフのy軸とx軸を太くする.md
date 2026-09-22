---
title: "[Chart.js] グラフのY軸とX軸を太くする"
pubDate: 2023-10-17
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアmohです。

ちらっと聞いた話ですが、趣味に関して。発達障害の人は趣味そのものを楽しみ、そうでない人は趣味を通した人間関係を楽しむのだそうです。

はたして私はどちらでしょう。学生の頃はプログラミングを趣味にしていましたが、今は仕事としてさせていただいています。プログラミングも楽しいと言えば楽しいですが、それよりも楽しいこともたくさんありますからね。時代の流れでプログラミングに将来性を見出してさせていただいています。もし将来AIがプログラマーの仕事を奪うようなことがあれば、次は何の仕事をしましょうか。話がそれました。

## Chart.jsでグラフのY軸とX軸を太くする

グラフには必ずY軸とX軸がありますが、その縦横の線を描いている場合の話ですね。目盛りとはまた違いまして、軸の話です。

軸だけを太くするには、以下のように自作pluginを作成します。

```javascript
const chartAreaBorder = {
    id: 'chartAreaBorder',
    afterDraw(chart, args, options) {
        const { ctx, chartArea: { left, top, width, height } } = chart
        ctx.save();
        ctx.globalAlpha = 0.5; // 効いてない？
        ctx.strokeStyle = options.borderColor
        ctx.lineWidth = options.borderWidth
        ctx.borderStyle = options.borderDash
        ctx.borderTopWidth = options.borderTopWidth
        ctx.setLineDash(options.borderDash || [])
        ctx.lineDashOffset = options.borderDashOffset

        // 下の線
        ctx.lineWidth = 2;  // 線の太さを設定
        ctx.beginPath();
        ctx.moveTo(left, top + height);
        ctx.lineTo(left + width, top + height);
        ctx.stroke();

        // 左の線
        ctx.lineWidth = options.borderWidth;
        ctx.beginPath();
        ctx.moveTo(left, top + height);
        ctx.lineTo(left, top);
        ctx.stroke();

        // ctx.strokeRect(left, top, width, height)
        ctx.restore()
    }
};
```

このpluginを以下のように適用します。

```javascript
 new Chart(ctx, {
            plugins: [chartAreaBorder],
            ...
```

Chart.jsのプラグイン関係はかなり複雑なこともできそうですが、ひとまず私にとって現在必要な部分だけとなっています。

ではでは。
