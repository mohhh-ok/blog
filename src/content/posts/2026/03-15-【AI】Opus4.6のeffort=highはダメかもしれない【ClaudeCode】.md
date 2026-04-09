---
title: 【AI】Opus4.6のeffort=highはダメかもしれない【ClaudeCode】
pubDate: 2026-03-15
updatedDate: 2026-04-09
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## 2026年4月9日追記

Claude Code開発者の一人であるBoris氏が、品質低下の話題について下記掲示板で言及しました。

https://news.ycombinator.com/item?id=47664442

主なポイントは以下の通りです。

- 2026年3月3日にeffortのデフォルトがmedium（内部値85）に変更されたことが公式に確認された
- 適応的思考（Adaptive Thinking）に問題があり、品質低下につながっている

特にAdaptive Thinkingによって推論量が0になった場合、ハルシネーションが発生するとのことです。暫定的な対策として、`CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`, `/effort high` を設定することが挙げられています。

下記はこの投稿が出る前に考察した文章ですが、参考のため残しておきます。


## Claude Codeでのeffort

Claude Codeでは各モデルにeffortを指定できます。これはlow, medium, highなどの選択肢があり、どれだけ深く思考するかを決定します。

深く思考するほど品質が良くなると思われがちですが、実はそうとも限らないかもしれません。

## Opus4.6のデフォルトeffortの変遷

Opus4.6は、当初highがデフォルトとしてリリースされていました。2026年2月5日
のブログで以下のように言及されています。

> If you’re finding that the model is overthinking on a given task, we recommend dialing effort down from its default setting (high) to medium.

https://www.anthropic.com/news/claude-opus-4-6

overthinking（考えすぎ）と思ったらeffortを下げるように書かれていますが、この時点ではhighがデフォルトでした。

しかし2026年3月5日ではmiduimがデフォルト（Max and Team subscribers）に設定されました。この変更は速度と深さのトレードオフを考慮したものです。

>  Version 2.1.68, shipped this week, restores the community's favorite magic keyword after a two-month absence that triggered hundreds of bug reports about degraded output quality. The same update also sets Opus 4.6 to medium effort by default for Max and Team subscribers - a trade-off between speed and depth that makes the ultrathink comeback more consequential than it sounds.

https://awesomeagents.ai/news/claude-code-ultrathink-returns-medium-effort-default/

また2026年3月15日時点では、私のClaude CodeでのOpus4.6使用時にmediumがデフォルトですよと言ったメッセージが出ていました。このメッセージが今回調査するきっかけになったものでしたが、残念ながらスクショは撮れていません。

## 消費者の反応

Opus4.6のhigh effortの品質が悪いという話があります。2026年2月10日には、Redditで、highよりmediumの方が品質がいいという投稿がありました。

> DefaultのHighは、毎回のように信頼性が後退してる気がするんだよね。なんでMediumをデフォルトにしないんだろ？

https://www.reddit.com/r/ClaudeCode/comments/1r0bb5z/opus_46_medium_effort_coding_is_huge

これはhighがデフォルトであった時の投稿で、highに不満を持つユーザーがいたことが確認できます。時系列的に、こうしたユーザーの反応を受けてmediumをデフォルトにしたのかもしれません。

## まとめ

コスト面だけではなく、品質のためにmediumを使うのも選択肢として考慮する必要がありそうです。
