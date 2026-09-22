---
title: "【MUI】DatePickerを日本語化する"
pubDate: 2025-03-20
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## MUI Datepicker

Datepickerは、デフォルトでFeb,Marchなどといった英語表記です。これを日本語にします。いつも忘れてしまうので、備忘録がわりです。

```
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import 'dayjs/locale/ja';

...
<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
...
</LocalizationProvider>

```

簡単ですね！
