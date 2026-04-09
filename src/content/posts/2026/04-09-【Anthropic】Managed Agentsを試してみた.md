---
title: 【Anthropic】Managed Agentsを試してみた
pubDate: 2026-04-09
categories: ["AI"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## Managed Agents

Anthropicが新しいサービス、Managed Agentsを始めました。まだ本番ではありませんが、高いポテンシャルを秘めていると思います。

Claude Managed Agentsは、自律型AIシステムを構築するためのインフラを提供するサービスです。これまで業務自動化の障壁となっていた複雑なプロセスを大幅に簡素化します。

## インストール

下記URLを参考に進めていきます。MacOSです。

https://platform.claude.com/docs/en/managed-agents/quickstart

```sh
brew install anthropics/tap/ant
xattr -d com.apple.quarantine "$(brew --prefix)/bin/ant"
ant --version
```

APIキーを取得します。

https://platform.claude.com/settings/workspaces/default/keys

.envを準備します。

```sh
touch .env
echo ".env" >> .gitignore
```

.envにAnthropicのAPIキーを入れます。

```sh
ANTHROPIC_API_KEY=ここにAPIキー

AGENT_ID=あとで書き込む
ENVIRONMENT_ID=あとで書き込む
```

## リモート構築

リモート環境を構築する必要があります。下記URLからGUIでぽちぽちできそうです。

https://platform.claude.com/workspaces/default/agent-quickstart

ただ今回は公式の手順に従って、CLIで進めていきます。

### エージェントと環境を構築する

まず.env.shから環境変数を有効にしておきます。

```sh
set -a
source .env
set +a
```

公式のサンプルはコーディングエージェントですが、今回はリサーチエージェントを作ってみます。modelの指定はエラー回避のためオブジェクト形式にしています。

```sh
ant beta:agents create \
  --name "Research Assistant" \
  --model '{"id": "claude-sonnet-4-6", "speed": "standard"}' \
  --system "あなたは優秀なリサーチアシスタントです。ユーザーのテーマについてウェブ検索を行い、情報を整理して、わかりやすいレポートをMarkdownファイルにまとめてください。日本語で回答してください。" \
  --tool '{type: agent_toolset_20260401}'
```

出力結果からidを.envのAGENT_IDに記録しておきます。

続いて実行環境を作成します。

```sh
ant beta:environments create \
  --name "quickstart-env" \
  --config '{type: cloud, networking: {type: unrestricted}}'
```

出力結果からidを.envのENVIRONMENT_IDに記録しておきます。


## TypeScriptで実行する

まずTypeScriptのためにパッケージをインストールします。

```sh
npm i @anthropic-ai/sdk dotenv zod
npm i -D @types/node
```

main.tsを書きます。

```ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import "dotenv/config";

// 環境変数を読み込む
const env = z.object({
  ANTHROPIC_API_KEY: z.string(),
  AGENT_ID: z.string(),
  ENVIRONMENT_ID: z.string(),
}).parse(process.env);

// クライアントを初期化
const client = new Anthropic();

// セッションを作成する関数
async function createSession() {
  const session = await client.beta.sessions.create({
    agent: env.AGENT_ID,
    environment_id: env.ENVIRONMENT_ID,
    title: "Quickstart session",
  });

  console.log(`Session ID: ${session.id}`);
  return session;
}

// メイン関数
async function main() {
  const session = await createSession();
  const stream = await client.beta.sessions.events.stream(session.id);

  // Send the user message after the stream opens
  await client.beta.sessions.events.send(session.id, {
    events: [
      {
        type: "user.message",
        content: [
          {
            type: "text",
            text: "Claude Managed Agentsを用いたサービス案をリサーチして考えて欲しい",
          },
        ],
      },
    ],
  });

  // Process streaming events
  for await (const event of stream) {
    if (event.type === "agent.message") {
      for (const block of event.content) {
        process.stdout.write(block.text);
      }
    } else if (event.type === "agent.tool_use") {
      console.log(`\n[Using tool: ${event.name}]`);
    } else if (event.type === "session.status_idle") {
      console.log("\n\nAgent finished.");
      break;
    }
  }
}

// 実行
main();
```

実行します。

```sh
npx tsx main.ts
```

実行結果が出力されました。以下のURLからも確認できるようになります。

https://platform.claude.com/workspaces/default/sessions

## まとめ

Managed Agentsは、手軽にAIサービスをクラウドで作成できて便利そうです。
