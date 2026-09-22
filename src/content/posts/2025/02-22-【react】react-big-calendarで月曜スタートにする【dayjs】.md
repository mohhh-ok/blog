---
title: "【React】react-big-calendarで月曜スタートにする【dayjs】"
pubDate: 2025-02-22
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## react-big-calendarで月曜スタートにする

momentを使用する場合は、以下のようにして設定できます。

[https://stackoverflow.com/questions/45671732/react-big-calendar-start-week-from-monday-instead-of-sunday](https://stackoverflow.com/questions/45671732/react-big-calendar-start-week-from-monday-instead-of-sunday)

一方、dayjsなら以下のようにします。

```jsx
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import dayjs from "dayjs";
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/ja';

dayjs.extend(updateLocale)
dayjs.locale('ja');
dayjs.updateLocale('ja', { weekStart: 1 })

export function MonthlyView() {
  const localizer = dayjsLocalizer(dayjs);
  return <Calendar localizer={localizer}
  ...
```
