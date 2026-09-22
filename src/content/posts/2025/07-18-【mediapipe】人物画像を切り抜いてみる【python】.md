---
title: "【MediaPipe】人物画像を切り抜いてみる【Python】"
pubDate: 2025-07-18
categories: ["AI"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## 人物画像の切り抜き

人物画像の切り抜きについて、Claude4sonnetに聞いてみました。

手法

人物精度

商用利用

処理速度

PerSAM

95%

✅ 完全無料

⭐️⭐️

MediaPipe Selfie

90%

✅ 完全無料

⭐️⭐️⭐️⭐️⭐️

BiRefNet

85%

✅ 完全無料

⭐️⭐️⭐️

SAM2

80%

✅ 完全無料

⭐️⭐️

REMBG

75%

✅ 完全無料

⭐️⭐️⭐️⭐️

RMBG 2.0

90%

❌ 商用契約必要

\-

PerSAMが最も品質は高いようです。髪の毛の細部まで上手く切り抜けるとか。ただその分処理速度に難があります。一方MediaPipeは人物切り抜きに強く、速度もあるようです。今回はMediaPipeを使用します。

## MediaPipeを使ってみる

まずインストールします。

```
uv init
uv venv
uv add mediapipe
```

assetsディレクトリの画像を、outputsに出力するコードです。AIによるVibeコーディングです。便利。

```python
import os
import cv2
import mediapipe as mp
from PIL import Image
import numpy as np
from pathlib import Path
from typing import Tuple, Optional


def remove_background(image: np.ndarray, mask: np.ndarray, background_color: Tuple[int, int, int] = (255, 255, 255),
                      smooth_edges: bool = True) -> np.ndarray:
    """
    背景を削除または単色背景に置き換える

    Args:
        image: 入力画像
        mask: セグメンテーションマスク
        background_color: 背景色（デフォルト：白）
        smooth_edges: エッジを滑らかにするかどうか

    Returns:
        背景を削除した画像
    """
    if smooth_edges:
        # エッジを滑らかにする処理
        mask = smooth_mask_edges(mask)

    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2RGB)
    mask_3ch = mask_3ch.astype(float) / 255.0

    background = np.full_like(image, background_color, dtype=np.uint8)
    result = image.astype(float) * mask_3ch + \
        background.astype(float) * (1 - mask_3ch)

    return result.astype(np.uint8)


def smooth_mask_edges(mask: np.ndarray, blur_size: int = 5, morph_size: int = 3) -> np.ndarray:
    """
    マスクのエッジを滑らかにする

    Args:
        mask: 入力マスク
        blur_size: ガウシアンブラーのサイズ
        morph_size: モルフォロジー変換のカーネルサイズ

    Returns:
        滑らかになったマスク
    """
    # 1. モルフォロジー変換でノイズ除去
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (morph_size, morph_size))

    # Opening（小さな穴を埋める）
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Closing（小さな隙間を埋める）
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # 2. ガウシアンブラーでエッジを滑らかに
    mask = cv2.GaussianBlur(mask, (blur_size, blur_size), 0)

    # 3. 軽いエロージョンで境界を少し内側に
    erosion_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    mask = cv2.erode(mask, erosion_kernel, iterations=1)

    # 4. 再度軽いブラー
    mask = cv2.GaussianBlur(mask, (3, 3), 0)

    return mask


def process_background_removal(image: np.ndarray, selfie_segmentation, background_color: Tuple[int, int, int],
                               smooth_edges: bool = True) -> np.ndarray:
    """
    背景分離処理を実行する

    Args:
        image: 入力画像（BGR）
        selfie_segmentation: MediaPipeの背景分離モデル
        background_color: 背景色
        smooth_edges: エッジを滑らかにするかどうか

    Returns:
        背景が削除された画像
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    segmentation_results = selfie_segmentation.process(image_rgb)

    if segmentation_results.segmentation_mask is not None:
        mask = (segmentation_results.segmentation_mask >
                0.5).astype(np.uint8) * 255
        return remove_background(image, mask, background_color, smooth_edges)

    return image


def detect_faces(image: np.ndarray, face_detection):
    """
    顔検出を実行する

    Args:
        image: 入力画像（BGR）
        face_detection: MediaPipeの顔検出モデル

    Returns:
        検出結果
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return face_detection.process(image_rgb)


def calculate_face_crop_coords(detection, image_shape: Tuple[int, int], margin: float = 0.3) -> Tuple[int, int, int, int]:
    """
    顔の切り出し座標を計算する

    Args:
        detection: 顔検出結果
        image_shape: 画像のサイズ (height, width)
        margin: マージンの割合

    Returns:
        (x1, y1, x2, y2) 切り出し座標
    """
    ih, iw = image_shape
    bboxC = detection.location_data.relative_bounding_box

    # 相対座標を絶対座標に変換
    x = int(bboxC.xmin * iw)
    y = int(bboxC.ymin * ih)
    w = int(bboxC.width * iw)
    h = int(bboxC.height * ih)

    # マージンを追加
    margin_x = int(w * margin)
    margin_y = int(h * margin)

    x1 = max(0, x - margin_x)
    y1 = max(0, y - margin_y)
    x2 = min(iw, x + w + margin_x)
    y2 = min(ih, y + h + margin_y)

    return x1, y1, x2, y2


def make_square_crop(x1: int, y1: int, x2: int, y2: int, image_shape: Tuple[int, int]) -> Tuple[int, int, int, int]:
    """
    切り出し領域を正方形に調整する

    Args:
        x1, y1, x2, y2: 元の切り出し座標
        image_shape: 画像のサイズ (height, width)

    Returns:
        (x1, y1, x2, y2) 正方形に調整された座標
    """
    ih, iw = image_shape

    crop_w = x2 - x1
    crop_h = y2 - y1
    size = max(crop_w, crop_h)

    center_x = (x1 + x2) // 2
    center_y = (y1 + y2) // 2

    half_size = size // 2
    x1 = max(0, center_x - half_size)
    y1 = max(0, center_y - half_size)
    x2 = min(iw, center_x + half_size)
    y2 = min(ih, center_y + half_size)

    return x1, y1, x2, y2


def crop_and_save_face(image: np.ndarray, x1: int, y1: int, x2: int, y2: int,
                       output_path: Path, filename: str) -> bool:
    """
    顔を切り出して保存する

    Args:
        image: 入力画像
        x1, y1, x2, y2: 切り出し座標
        output_path: 出力ディレクトリ
        filename: 出力ファイル名

    Returns:
        保存成功の可否
    """
    face_crop = image[y1:y2, x1:x2]

    if face_crop.size == 0:
        return False

    output_file_path = output_path / filename
    success = cv2.imwrite(str(output_file_path), face_crop)

    if success:
        print(
            f"💾 保存: {filename} (サイズ: {face_crop.shape[1]}x{face_crop.shape[0]})")

    return success


def process_single_image(image_path: Path, face_detection, selfie_segmentation,
                         output_path: Path, remove_bg: bool, background_color: Tuple[int, int, int],
                         face_count: int, margin: float = 0.3, smooth_edges: bool = True) -> int:
    """
    1つの画像を処理する

    Args:
        image_path: 画像ファイルのパス
        face_detection: MediaPipeの顔検出モデル
        selfie_segmentation: MediaPipeの背景分離モデル
        output_path: 出力ディレクトリ
        remove_bg: 背景削除フラグ
        background_color: 背景色
        face_count: 現在の顔カウント
        margin: マージンの割合
        smooth_edges: エッジを滑らかにするかどうか

    Returns:
        処理した顔の数
    """
    print(f"🔍 処理中: {image_path.name}")

    # 画像を読み込み
    image = cv2.imread(str(image_path))
    if image is None:
        print(f"❌ 画像を読み込めませんでした: {image_path}")
        return 0

    # 背景分離処理
    processed_image = image.copy()
    if remove_bg:
        processed_image = process_background_removal(
            image, selfie_segmentation, background_color, smooth_edges)
        edge_status = "滑らかな境界" if smooth_edges else "標準境界"
        print(f"✅ 背景を削除しました ({edge_status})")

    # 顔検出実行
    results = detect_faces(image, face_detection)

    if not results.detections:
        print(f"❌ 顔が検出されませんでした: {image_path.name}")
        return 0

    print(f"✅ {len(results.detections)} 個の顔を検出")

    faces_saved = 0

    # 検出された各顔を処理
    for i, detection in enumerate(results.detections):
        # 切り出し座標を計算
        x1, y1, x2, y2 = calculate_face_crop_coords(
            detection, processed_image.shape[:2], margin)

        # 正方形に調整
        x1, y1, x2, y2 = make_square_crop(
            x1, y1, x2, y2, processed_image.shape[:2])

        # 出力ファイル名生成
        bg_suffix = "_nobg" if remove_bg else ""
        filename = f"face_{face_count + faces_saved:04d}_{image_path.stem}_{i:02d}{bg_suffix}.jpg"

        # 顔を切り出して保存
        if crop_and_save_face(processed_image, x1, y1, x2, y2, output_path, filename):
            faces_saved += 1

    return faces_saved


def get_image_files(assets_path: Path) -> list:
    """
    画像ファイルのリストを取得する

    Args:
        assets_path: アセットディレクトリのパス

    Returns:
        画像ファイルのリスト
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}

    return [
        path for path in assets_path.iterdir()
        if path.is_file() and path.suffix.lower() in image_extensions
    ]


def extract_faces_from_images(assets_dir: str = "assets", output_dir: str = "output",
                              remove_bg: bool = True, background_color: Tuple[int, int, int] = (255, 255, 255),
                              margin: float = 0.3, smooth_edges: bool = True):
    """
    assetsディレクトリから画像を読み込み、mediapipeで顔を検出・抽出して保存する

    Args:
        assets_dir: 入力画像があるディレクトリ
        output_dir: 抽出した顔画像を保存するディレクトリ
        remove_bg: 背景を削除するかどうか
        background_color: 背景色（RGB）
        margin: 顔の周りのマージン（割合）
        smooth_edges: エッジを滑らかにするかどうか
    """
    # ディレクトリの存在確認・作成
    assets_path = Path(assets_dir)
    output_path = Path(output_dir)

    if not assets_path.exists():
        print(f"❌ {assets_dir} ディレクトリが存在しません")
        return

    output_path.mkdir(exist_ok=True)
    print(f"📁 出力ディレクトリ: {output_path}")

    # 画像ファイルのリストを取得
    image_files = get_image_files(assets_path)
    if not image_files:
        print(f"❌ {assets_dir} に画像ファイルが見つかりません")
        return

    print(f"📸 処理対象: {len(image_files)} 個の画像ファイル")

    # MediaPipeの初期化
    mp_face_detection = mp.solutions.face_detection
    mp_selfie_segmentation = mp.solutions.selfie_segmentation

    face_count = 0

    with mp_face_detection.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.5
    ) as face_detection, mp_selfie_segmentation.SelfieSegmentation(
        model_selection=1
    ) as selfie_segmentation:

        # 各画像ファイルを処理
        for image_path in image_files:
            faces_found = process_single_image(
                image_path, face_detection, selfie_segmentation,
                output_path, remove_bg, background_color, face_count, margin, smooth_edges
            )
            face_count += faces_found

    print(f"\n🎉 処理完了! 合計 {face_count} 個の顔を抽出しました")
    print(f"📁 出力先: {output_path}")
    if remove_bg:
        print(f"🎨 背景色: RGB{background_color}")


def main():
    print("🚀 MediaPipe顔抽出ツール（DreamBooth学習データ生成用）")
    print("=" * 50)

    # 設定
    remove_background_flag = True  # 背景を削除するかどうか
    background_color = (255, 255, 255)  # 白背景（RGB）
    margin = 0.3  # 顔の周りのマージン（30%）
    smooth_edges = True  # エッジを滑らかにするかどうか

    print(f"🎨 背景削除: {'ON' if remove_background_flag else 'OFF'}")
    if remove_background_flag:
        print(f"🎨 背景色: RGB{background_color}")
        print(f"🎨 エッジ処理: {'滑らか' if smooth_edges else '標準'}")
    print(f"🎯 マージン: {int(margin * 100)}%")

    # 顔抽出実行
    extract_faces_from_images(
        remove_bg=remove_background_flag,
        background_color=background_color,
        margin=margin,
        smooth_edges=smooth_edges
    )


if __name__ == "__main__":
    main()

```

実行します。

```
uv run main.py
```

顔部分が切り抜かれました。初期実行時は少し時間がかかりましたが、２回目以降は一瞬で完了するようになりました。
