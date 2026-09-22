---
title: "【Flutter】CSS込みでHTMLを描画する"
pubDate: 2025-01-21
categories: ["Flutter"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## FlutterでのHTML表示まわり

Flutterでは、HTMLに関するライブラリはいくつかあります。しかし独自実装されており、CSSが反映されなかったりします。flutter\_widget\_from\_htmlなどは、限定的な機能です。

## flutter\_inappwebview

flutter\_inappwebviewでは、CSSが反映されます。HTMLを表示するには、以下のようにします。Containerなどで囲むことで、正常に表示されます。

```dart
Container(
  width: 500,
  height: 200,
  child: InAppWebView(
    initialData: InAppWebViewInitialData(
      data: html,
    )
  )
);
```

スクロールバーが自動で表示されるのも、嬉しいですね。

更新を反映させるには、以下のようにcontrollerを使用します。

```dart
InAppWebViewController? webViewController;

class PastePanel extends ConsumerWidget {
  // ...

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appData = ref.watch(appDataStateProvider);

    if (appData.isLoading) return const SizedBox.shrink();
    if (appData.hasError) return const Text('Error loading app data');

    ref.listen(appDataStateProvider, (prev, next) {
      webViewController?.loadData(data: (next.value?.targetText ?? ''));
    });

    return Container(
      width: 500,
      height: 200,
      child: InAppWebView(
        initialData: InAppWebViewInitialData(
          data: appData.value!.targetText ?? '',
        ),
        onWebViewCreated: (controller) {
          webViewController = controller;
        },
      );
  }
}

```
