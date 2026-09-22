---
title: "【TypeForm】Popupが閉じられた後スクロールできなくなる問題勃発"
pubDate: 2025-02-06
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## TypeForm

TypeFormは、Google Formのように簡単にアンケートフォームを作れるプラットフォームです。

[https://www.typeform.com](https://www.typeform.com)

## Popup

以下のようにして、Popupを表示することができます。

```javascript
import { createPopup } from '@typeform/embed'
import '@typeform/embed/build/css/popup.css'

const { toggle } = createPopup('<form-id>')
document.getElementById('button').onclick = toggle
```

## 閉じた後にスクロールが効かなくなる

@typeform/embed:^5.3.0で、閉じた後スクロールが効かなくなります。document.bodyにoverflow:hiddenスタイルが割り当てられているためです。

以下のようにして解消します。

```javascript
createPopup('<form-id>', {
  onClose: () => setTimeout(() => document.body.style.overflow = 'auto', 1000);
});
```

setTimeoutを入れないと、解消されません。setTimeoutを入れると解消します、はい。
