---
title: "【React】ComponentType&lt;T>で汎用コンポーネントを作成する【Typescript】"
pubDate: 2024-10-17
categories: ["React"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## React.ComponentType<T>

React.ComponentType<T>は、T型のPropsを受け取るコンポーネントを表します。例えば、以下のPersonComponentと、PersonComponent2は同じ働きになります。

```jsx
type Person = {
    name: string;
    age: number;
}

const PersonComponent = (props: Person) => {
    return <>{props.name} {props.age}</>
}

const PersonComponent2: React.ComponentType<Person> = (props) => {
    return <>{props.name} {props.age}</>
}
```

## 汎用的なComponentを作る

以下のようにして、Person,Book両方のコンポーネントに対応した、汎用的なものを作ることができます。

```jsx

type Person = {
    name: string;
    age: number;
}

type Book = {
    title: string;
    author: string;
}

type ComponentProps<T> = {
    item: T;
}

const PersonComponent = (props: ComponentProps<Person>) => {
    return <div>{props.item.name} {props.item.age}</div>
}

const BookComponent = (props: ComponentProps<Book>) => {
    return <div>{props.item.title} {props.item.author}</div>
}

const FlexibleComponent = <T,>(props: {
    Component: React.ComponentType<ComponentProps<T>>;
    item: T;
    description: string;
}) => {
    return <>
        <props.Component item={props.item} />
        {props.description}
    </>
}

export default function Test() {
    return <div>
        <FlexibleComponent Component={PersonComponent} item={{ name: "太郎", age: 20 }} description="人" />
        <FlexibleComponent Component={BookComponent} item={{ title: "吾輩は猫である", author: "夏目漱石" }} description="本" />
    </div>
}
```
