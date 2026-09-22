---
title: "PythonでのPagination"
pubDate: 2023-08-02
categories: ["Python"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

PythonでPaginationを実装しました。

案外時間のかかる作業だったのですが、その原因の一つにインターネットであまりサンプルらしいものに出会えなかったのがあります。

ChatGPTに作ってもらったりもしましたが、なかなかうまくいかなかったので結局１から自分で書きました。

ということで、共有させていただきます。次のようなPaginationが作成されます。

< 1 ... 6 7 8 9 10 ... 16 >

省略記号に加え、前へ、次へのリンクもあり、現在のページにはcurrentクラスも付与されます。Paginationではおそらく最大限の実装かと思います。

Pythonコードは以下です。

```python
def make_a(num: int, current: bool, text: str = None):
    """
    ページ番号をリンクに変換する
    """

    # 文字列が指定されていない場合は、ページ番号をそのまま表示
    if not text:
        text = num

    current_str = "current" if current else ""

    # 数字ならリンクを作成。
    if isinstance(num, int):
        return (
            f"<a class='page-link {current_str}' href='?page={num}'>{text}</a>"
        )
    # 省略記号ならリンクを作成しない。
    else:
        return f"<a class='page-link' name=''>{text}</a>"


def pagination(page: int, page_count: int):
    """
    ページネーションを作成する

    page: 現在のページ番号
    page_count: ページ数

    例: page=8, page_count=16 の場合
    < 1 ... 6 7 8 9 10 ... 16 >
    
    選択中のページはcurrentクラスが付与される
    """

    if page_count <= 1:
        return ""

    nums = set()

    # 現在のページの前後2ページを取得
    for num in range(page - 2, page + 3):
        if num > 0 and num <= page_count:
            nums.add(num)

    nums = sorted(list(nums))

    # 省略記号を追加
    if nums[0] > 2:
        nums.insert(0, "...")
    if nums[-1] < page_count - 1:
        nums.append("...")

    # 最初と最後のページを追加
    if nums[0] != 1:
        nums.insert(0, 1)
    if nums[-1] != page_count:
        nums.append(page_count)

    # ここまでのページ番号をリンクに変換
    a_list = [make_a(num, num == page) for num in nums]

    # 次へ、前へのリンクを追加
    if page > 1:
        a_list.insert(0, make_a(page - 1,False, "&lt;"))
    if page < page_count:
        a_list.append(make_a(page + 1, False,"&gt;"))

    li_list = [f"<li class='page-item'>{a}</li>" for a in a_list]

    nav = f"""
<nav aria-label="Page navigation example">
    <ul class="pagination">
        {"".join(li_list)}
    </ul>   
</nav>"""

    return nav

```
