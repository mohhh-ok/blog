---
title: "【MUI】@toolpad/coreのDialogsProviderが便利すぎる【TypeScript】"
pubDate: 2024-10-17
categories: ["MUI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## MUI

MUIはGoogleの開発するReactライブラリで、簡単にマテリアルデザインを実装できます。

## DialogsProvider

DialogsProviderは、MUI Toolpadにある、Dialogを簡単に使えるようにするためのツールです。2024年10月17日時点で情報があまりないので、今回まとめることにした次第です。

https://mui.com/toolpad/core/api/dialogs-provider

## 事前準備

まずはインストール

```
npm i @toolpad/core
```

Providerなので、ルートを囲みます。

```jsx
import { DialogsProvider } from '@toolpad/core/useDialogs';

function App({ children }) {
  return <DialogsProvider>{children}</DialogsProvider>;
}
```

これで使用準備はOKです

## アラートなどを表示する

通常、Dialogを使ってalertを表示する場合、その都度Dialogを書くか、自分でProviderを作って実装する必要がありました。しかしDialogsProviderを使えば、以下のように簡単に書けます。

```jsx
import { useDialogs } from "@toolpad/core"
export default function Test() {
    const dlgs = useDialogs();
    return <Button onClick={() => dlgs.alert('Hello World!')}>Open</Button>
}
```

コンファームも実装されています。

```jsx
import { useDialogs } from "@toolpad/core"

export default function Test() {
    const dlgs = useDialogs();
    async function handleOpen() {
        const result = await dlgs.confirm('OK?');
        dlgs.alert('result: ' + result);
    }
    return <Button onClick={handleOpen}>Open</Button>
}
```

上記のように、結果を取得したりする場合は非同期処理となります。async, awaitを通常は使用します。

## カスタムダイアログを使用する

独自ダイアログを作成することで、簡単に結果を取得したりできます。

### 型を宣言する

DialogsProviderを使用する場合、DialogPropsはtoolpadのものを使用します。

```jsx
import { DialogProps } from "@toolpad/core"
```

以下のように、InputとOutputを指定します。

```typescript
type InputProps = {
    name: string;
}

type ResultProps = {
    age: number;
}

type CustomDialogProps = DialogProps<InputProps, ResultProps> 
```

### カスタムダイアログを作成する

今回、名前を渡して年齢を返すダイアログを作成しました。受け取ったデータは、payloadに格納されています。

```jsx
function CustomDialog(props: CustomDialogProps) {
    const [age, setAge] = useState(0);

    return <Dialog open={props.open} onClose={props.onClose}>
        <DialogTitle>Custom Dialog</DialogTitle>
        <DialogContent>
            <Box>
                <Box>
                    name: {props.payload.name} // payloadで受け取る
                </Box>
                <Box>
                    <TextField type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />
                </Box>
            </Box>
            <Box>
                <Button onClick={() => props.onClose({ age })}>OK</Button> // onCloseで結果を返す
            </Box>
        </DialogContent>
    </Dialog>
}
```

### カスタムダイアログを使用する

以下のように、インプットを渡して結果を受け取れます。

```jsx
export function Test() {
    const dlgs = useDialogs();

    async function handleOpen() {
        const result = await dlgs.open(CustomDialog, { name: 'John' });
        dlgs.alert('result: ' + JSON.stringify(result)); // age
    }

    return <div>
        <Button onClick={handleOpen}>Open</Button>
    </div>
}

```

いやあ、便利ですね。
