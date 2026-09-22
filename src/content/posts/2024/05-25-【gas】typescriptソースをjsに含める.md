---
title: "【GAS】TypeScriptソースをjsに含める"
pubDate: 2024-05-25
categories: ["GAS"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## GASでTypeScriptを使う

GASは基本的には、ウェブ上でJavaScriptを書く仕様となっています。しかしclaspというツールを使えば、ローカルで開発することが可能です。さらにTypeScriptでJSに変換し、pushすることもできるようになります。

### 問題点

claspでGAS開発を行う場合、いろいろと問題点があります。そのうちの一つが、TypeScriptのソースが実行環境で失われると言う点です。コンパイル後のJSのみをpushするため当然なのですが。

そのため過去に開発した、あるいは誰かによって開発されたGASをいじるときに、JSしかないため苦労することになります。JSのまま開発を進めるか、TypeScriptに書き直して進めるかの選択を迫られることになります。

それを回避するため、TypeScriptのソースをJSに含める方法を考えてみました。

## TypeScriptソースをコメントとしてJSに含める

TypeScriptコンパイル時に、元のソースをコメントとして出力するようにします。

必要なのはGAS開発に必要な最低限のパッケージに加え、ttscが必要です。package.jsonは以下のようになります。

```
{  
  "dependencies": {},  
  "devDependencies": {  
    "@types/google-apps-script": "^1.0.83",  
    "ts-node": "^10.9.2",  
    "ttsc": "^0.3.1",  
    "typescript": "^5.4.5"  
  }  
}
```

transformer.tsを作成します。

```
import * as ts from 'typescript';  
  
const PRE = '\n\n\n// *** typescript *** //\n\n';  
  
function addSourceCodeAsComment(context: ts.TransformationContext) {  
    return (sourceFile: ts.SourceFile) => {  
        const sourceText = sourceFile.text;  
        const commentText =  
            PRE +  
            sourceText  
                .split('\n')  
                .map((line) => `// ${line}`)  
                .join('\n');  
        const comment = ts.addSyntheticTrailingComment(  
            sourceFile.statements[sourceFile.statements.length - 1],  
            ts.SyntaxKind.SingleLineCommentTrivia,  
            `\n${commentText}\n`,  
            true  
        );  
        const visitor: ts.Visitor = (node) => {  
            return ts.visitEachChild(node, visitor, context);  
        };  
        return ts.visitNode(sourceFile, visitor);  
    };  
}  
  
export default function transformer(program: ts.Program) {  
    return (context: ts.TransformationContext) => {  
        return addSourceCodeAsComment(context);  
    };  
}
```

tsconfig.jsonを以下のようにします。

```
{  
    "compilerOptions": {  
        "target": "ES2020",  
        "module": "commonjs",  
        "rootDir": "./src",  
        "outDir": "./dist",  
        "esModuleInterop": true,  
        "forceConsistentCasingInFileNames": true,  
        "strict": true,  
        "skipLibCheck": true,  
        "plugins": [  
            {  
                "transform": "./transformer.ts",  
            }  
        ]  
    },  
    "include": [  
        "src/**/*.ts"  
    ],  
}
```

これで、以下のコマンドを実行すれば、TypeScriptのコンパイルと同時にソースコードがコメントとして含まれるようになります。

```
npx ttsc
```

## 余談

紅茶花伝のロイヤルミルクティーにハマってます。ドラッグストアで安く売ってるので重宝していたのですが、最近売り切れが続いていて、代わりにレモンティーを買っています。寂しいです。
