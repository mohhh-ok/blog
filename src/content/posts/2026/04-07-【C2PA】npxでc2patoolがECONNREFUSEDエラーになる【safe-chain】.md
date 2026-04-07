---
title: 【C2PA】npxでc2patoolがECONNREFUSEDエラーになる【safe-chain】
pubDate: 2026-04-07
categories: ["C2PA"]
---

こんにちは、フリーランスエンジニアの太田雅昭です。

## c2patoolがECONNREFUSEDエラー

c2paにタイムスタンプを埋め込む場合、タイムスタンプサーバーにアクセスする必要があります。c2patoolを普通に呼び出すと問題なくアクセスできるのですが、vitest経由だとECONNREFUSEDでエラーになりました。

## Aikidoのsafe-chain

昨今のnpmセキュリティの問題から、Aikido Securityのsafe-chainを愛用しています。

https://github.com/AikidoSec/safe-chain

これはnpm, pnpm, bunなどのパッケージマネージャーをラップして、遅延などを挿入してくれます。

しかしこのsafe-chainが`HTTPS_PROXY`環境変数を設定するため、c2patoolがタイムスタンプサーバーにアクセスできない状態になっていました。

## 再現テスト

vitest + execa で再現テストを作りました（もちろんAIが）

```ts
import { describe, it, expect } from "vitest";
import { $ } from "execa";

describe("safe-chain HTTPS_PROXY breaks c2patool timestamp", () => {
  it("HTTPS_PROXY is injected by safe-chain", () => {
    // safe-chain 経由で npx vitest を実行すると注入される
    expect(process.env.HTTPS_PROXY).toMatch(/^http:\/\/localhost:\d+$/);
  });

  it("c2patool fails to reach timestamp server", async () => {
    try {
      await $({
        env: { C2PA_TA_URL: "http://timestamp.digicert.com" },
        timeout: 15000,
      })`c2patool test-input.jpg -m test-manifest.json -o output.jpg --no_signing_verify -f`;
    } catch (e: any) {
      // HTTPS_PROXY のせいでタイムスタンプサーバーに接続できない
      expect(e.stderr).toContain("error");
    }
  });

  it("works when HTTPS_PROXY is cleared", async () => {
    const result = await $({
      env: {
        C2PA_TA_URL: "http://timestamp.digicert.com",
        HTTPS_PROXY: "",
        HTTP_PROXY: "",
        GLOBAL_AGENT_HTTP_PROXY: "",
      },
      timeout: 30000,
    })`c2patool test-input.jpg -m test-manifest.json -o output.jpg --no_signing_verify -f`;

    expect(result.exitCode).toBe(0);
    const manifest = JSON.parse(result.stdout);
    const sigInfo = manifest.manifests[manifest.active_manifest]?.signature_info;
    // タイムスタンプが付与されている
    expect(sigInfo?.time).toBeTruthy();
  }, 60000);
});
```

`HTTPS_PROXY` を空にして渡すだけで成功します。問題は safe-chain が注入する環境変数にあることがわかります。

## 回避策

### 方法 1: プロキシ環境変数を空にして渡す

```ts
const result = await $({
  env: {
    HTTPS_PROXY: "",
    HTTP_PROXY: "",
    GLOBAL_AGENT_HTTP_PROXY: "",
  },
})`c2patool input.jpg -m manifest.json -o output.jpg`;
```

`extendEnv` はデフォルトで `true` なので、`process.env` の他の変数はそのまま引き継がれつつ、プロキシ関連だけ無効化できます。

### 方法 2: extendEnv: false で必要な変数だけ渡す

```ts
const result = await $({
  env: {
    PATH: process.env.PATH!,
    HOME: process.env.HOME!,
    C2PA_TA_URL: "http://timestamp.digicert.com",
  },
  extendEnv: false,
})`c2patool input.jpg -m manifest.json -o output.jpg`;
```

親プロセスの環境変数を一切引き継がないので確実ですが、必要な変数を自分で列挙する必要があります。

## issueを提出

今回の件はsafe-chainがHTTPS_PROXYを設定していることに起因しているため、issueを提出しました。今後解決されれば不要となりますが、当分はユーザーでの対策は必要かと思います。

https://github.com/AikidoSec/safe-chain/issues/398
