---
title: "【React】react-big-calendarで月表示イベントが表示されない問題"
pubDate: 2025-02-22
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## react-big-calendarで、月表示でイベントが表示されない

下記のようにすると、月間表示でのイベントが隠れてしまいました。

```jsx
<Calendar localizer={localizer}
  events={[{
    title: 'test',
    start: dayjs().set('date', 1).set('hour', 5).toDate(),
    end: dayjs().set('date', 1).set('hour', 12).toDate(),
  }]}
  defaultView="month"
/>
```

## 高さを設定すれば表示される

高さを指定すると、表示されるようになります。

```jsx
<Calendar localizer={localizer}
  events={[{
    title: 'test',
    start: dayjs().set('date', 1).set('hour', 5).toDate(),
    end: dayjs().set('date', 1).set('hour', 12).toDate(),
  }]}
  defaultView="month"
  style={{height:"100vh"}}
/>
```
