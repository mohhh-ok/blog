---
title: "【C2PA】ffmpegで変換して署名する"
pubDate: 2025-10-14
categories: ["C2PA"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## C2PAに署名

C2PAは、c2patoolを使用して簡単に署名を行うことができます。

詳細はこちらに書かれています。

[https://github.com/contentauth/c2pa-rs/blob/main/cli/docs/usage.md](https://github.com/contentauth/c2pa-rs/blob/main/cli/docs/usage.md)

ひとまず署名するだけなら以下でいけます。

```bash
c2patool sample/image.jpg -m sample/test.json -o signed_image.jpg
```

もし既存のmanifestが存在していれば、それに追記する形で署名してくれます。それによりルートを辿ることが可能となり、ファイルの信頼性が担保されます。

## 変換してから署名するには

一方ファイルに変更を加えると、ツールによってはC2PA情報が消えます。2025年10月14日時点でほとんどのツールが、C2PA未対応です。たとえばffmpegを使用すると、未知のメタデータとして破棄されるようです。

このため変換してから署名を行うには一手間必要となります。以下のような流れとなります。

*   ファイルから既存のC2PAをingredientとして抽出
*   任意の変換処理
*   ingredientを使用して署名

下記ではそのプロセスを記します。

まず環境構築します。

```bash
mkdir c2pa-test
cd c2pa-test
brew install c2patool
pnpm i execa
pnpm i -D @types/node tsx
```

manifest.jsonを用意します。

```json
{
  "ta_url": "http://timestamp.digicert.com",
  "claim_generator": "MyTestSigner/0.1",
  "assertions": [
    {
      "label": "c2pa.actions",
      "data": {
        "actions": [
          {
            "action": "c2pa.edited",
            "parameters": {
              "test": true,
              "description": "新規追加（テスト用途）"
            }
          }
        ]
      }
    },
    {
      "label": "org.example.testing",
      "data": {
        "is_test": true,
        "note": "この署名はテスト目的で付与されました"
      }
    }
  ]
}
```

claim\_generatorにMyTestSigner/0.1といった独自の値を入れていますが、これはc2patoolによって上書きされるため意味はありません。しかしdescriptionやnoteはそのまま文字列が入ります。そのため、実際にこのマニフェストが適用されることが確認できるようになります。

C2PA素材をダウンロードします。

[https://spec.c2pa.org/public-testfiles/video](https://spec.c2pa.org/public-testfiles/video)

今回はtruepic-20230212-zoetrope.mp4を使用しました。./assetsディレクトリに保存します。

以下コードです。

```typescript
// c2pa-test.ts
import { execa } from 'execa';
import { mkdtempSync } from 'fs';
import { rm } from 'fs/promises';
import os from 'os';
import path from 'path';

const INPUT_FILE = './assets/truepic-20230212-zoetrope.mp4'
const SIGNED_FILE = `${INPUT_FILE}_signed${path.extname(INPUT_FILE)}`
const REPORT_DIR = `report`
const MANIFEST_FILE = './manifest.json'

async function main() {
  await signWithTransform({
    input: INPUT_FILE,
    manifestPath: MANIFEST_FILE,
    output: SIGNED_FILE,
    transform: async ({ input, destination }) => {
      // ffmpeg を使って解像度を半分にスケールする
      console.log(`Transcoding (half size) ${input} -> ${destination}`)
      await execa('ffmpeg', [
        '-y',
        '-hide_banner',
        '-loglevel', 'error',
        '-i', input,
        '-vf', 'scale=iw/2:ih/2',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'copy',
        destination,
      ])
    }
  })

  // 確認用に署名後のファイルを出力
  console.log(`Reporting -> ${REPORT_DIR}`)
  await execa(`c2patool`, [SIGNED_FILE, '-f', '--output', REPORT_DIR])
}

main();



// 変換（トランスフォーム）込みで署名するプロセス
async function signWithTransform(params: {
  input: string,
  manifestPath: string,
  output: string,
  transform: (params: { input: string, destination: string }) => Promise<void>
}) {
  const { input, manifestPath, output, transform } = params

  // 一時ディレクトリを作成して処理を行う
  await withTmpDir(async (tmpDir) => {

    // ingredientを抽出
    const ingredientDir = path.join(tmpDir, 'ingredient')
    await extractIngredient({
      input,
      ingredientDir
    })

    const transformedPath = path.join(tmpDir, 'transformed')

    // 変換処理を行う
    await transform({ input, destination: transformedPath });

    // ingredientを使用して署名を行う
    await signFile({
      input: transformedPath,
      output,
      manifestPath,
      ingredientDir
    })
  });
}

// 既存のmanifestをingredientとして抽出
async function extractIngredient(params: { input: string, ingredientDir: string }) {
  const { input, ingredientDir } = params
  console.log(`Extracting ingredient from ${input} -> ${ingredientDir}`)
  await execa(`c2patool`, [input, '--ingredient', '--output', ingredientDir])
}

// ingredientを使用して署名
async function signFile(params: { input: string, output: string, manifestPath: string, ingredientDir: string }) {
  const { input, output, manifestPath, ingredientDir } = params
  console.log(`Signing ${input} with manifest ${manifestPath} and ingredient ${ingredientDir} to ${output}`)
  await execa(`c2patool`, [input, '-m', manifestPath, '-p', ingredientDir, '-f', '-d', '-o', output])
}


// 一時ディレクトリを作成して処理を行うユーティリティ
async function withTmpDir<T = unknown>(fn: (tmpDir: string) => Promise<T>): Promise<T> {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'c2patool-sign-with-transform-'))
  try {
    return await fn(tmpDir)
  } catch (e) {
    throw e
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}

```

これを実行します。

```bash
tsx c2pa-test.ts
```

transorm, signedそれぞれのファイルと、reportディレクトリが生成されます。

reportディレクトリを確認してみます。manifest.jsonとmanifest\_store.jsonが生成されました。このうちmanifest.jsonは人が読む用、manifest\_store.jsonは機械が読む用だとのことです。しかし今回は同じような出力になりました。

manifest.jsonを確認すると、ちゃんとテスト用で流し込んだmanifestの情報が入っていることが確認できます。またValidステータスもtrueとなっていることから、成功です。

```json
// manifest.json
{
  "active_manifest": "urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16",
  "manifests": {
    "urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16": {
      "claim_generator_info": [
        {
          "name": "c2pa-rs",
          "version": "0.67.1",
          "org.contentauth.c2pa_rs": "0.67.1"
        }
      ],
      "title": "truepic-20230212-zoetrope.mp4_signed.mp4",
      "instance_id": "xmp:iid:1fe6cb90-7992-4006-bed6-fd6a2d2dd325",
      "ingredients": [
        {
          "title": "truepic-20230212-zoetrope.mp4",
          "format": "video/mp4",
          "instance_id": "xmp:iid:5bb5af77-ee4c-44d8-8c0b-20c6b604d774",
          "relationship": "parentOf",
          "active_manifest": "com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794",
          "validation_results": {
            "activeManifest": {
              "success": [
                {
                  "code": "timeStamp.validated",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.signature",
                  "explanation": "timestamp message digest matched: Truepic Lens Time-Stamping Authority"
                },
                {
                  "code": "claimSignature.insideValidity",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.signature",
                  "explanation": "claim signature valid"
                },
                {
                  "code": "claimSignature.validated",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.signature",
                  "explanation": "claim signature valid"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/com.truepic.libc2pa",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/com.truepic.libc2pa"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__1",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__1"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__2",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__2"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/com.truepic.custom.odometry",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/com.truepic.custom.odometry"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/c2pa.hash.bmff.v2",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/c2pa.hash.bmff.v2"
                },
                {
                  "code": "assertion.hashedURI.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__3",
                  "explanation": "hashed uri matched: self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/stds.exif__3"
                },
                {
                  "code": "assertion.bmffHash.match",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.assertions/c2pa.hash.bmff.v2",
                  "explanation": "data hash valid"
                }
              ],
              "informational": [
                {
                  "code": "timeStamp.untrusted",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.signature",
                  "explanation": "timestamp cert untrusted: Truepic Lens Time-Stamping Authority"
                }
              ],
              "failure": [
                {
                  "code": "signingCredential.expired",
                  "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794/c2pa.signature",
                  "explanation": "certificate expired"
                }
              ]
            }
          },
          "label": "c2pa.ingredient.v3"
        }
      ],
      "assertions": [
        {
          "label": "c2pa.actions.v2",
          "data": {
            "actions": [
              {
                "action": "c2pa.opened",
                "parameters": {
                  "ingredients": [
                    {
                      "url": "self#jumbf=c2pa.assertions/c2pa.ingredient.v3",
                      "hash": "UBXZ8VsuwAIgT8c53x0NM8Bio1fFFGYWc+q2RTrSpIg="
                    }
                  ]
                }
              },
              {
                "action": "c2pa.edited",
                "parameters": {
                  "description": "新規追加（テスト用途）",
                  "test": true
                }
              }
            ]
          }
        },
        {
          "label": "c2pa.hash.bmff.v3",
          "data": {
            "exclusions": [
              {
                "xpath": "/uuid",
                "length": null,
                "data": [
                  {
                    "offset": 8,
                    "value": "2P7D1hsOSDySl1goh37EgQ=="
                  }
                ],
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              },
              {
                "xpath": "/ftyp",
                "length": null,
                "data": null,
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              },
              {
                "xpath": "/mfra",
                "length": null,
                "data": null,
                "subset": null,
                "version": null,
                "flags": null,
                "exact": null
              }
            ],
            "alg": "sha256",
            "hash": "+bLZaoW/IF/FXjgTFNiEHUEKRMT503JRqTvmjyHYpRw=",
            "name": "jumbf manifest"
          }
        },
        {
          "label": "org.example.testing",
          "data": {
            "note": "この署名はテスト目的で付与されました",
            "is_test": true
          }
        }
      ],
      "signature_info": {
        "alg": "Es256",
        "issuer": "C2PA Test Signing Cert",
        "common_name": "C2PA Signer",
        "cert_serial_number": "640229841392226413189608867977836244731148734950",
        "time": "2025-10-14T14:20:14+00:00"
      },
      "label": "urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16"
    },
    "com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794": {
      "claim_generator": "Truepic_Lens_SDK_libc2pa/2.5.1",
      "claim_generator_info": [
        {
          "name": "Truepic Lens SDK libc2pa C++ Library",
          "version": "2.5.1"
        }
      ],
      "title": "f5ba0ad3-7e5f-4f67-b909-ea6ff1cd5536.mp4",
      "format": "video/mp4",
      "instance_id": "f5ba0ad3-7e5f-4f67-b909-ea6ff1cd5536",
      "ingredients": [],
      "assertions": [
        {
          "label": "com.truepic.libc2pa",
          "data": {
            "git_hash": "023bb51",
            "lib_name": "Truepic C2PA C++ Library",
            "lib_version": "2.5.1",
            "target_spec_version": "1.2"
          }
        },
        {
          "label": "stds.exif",
          "data": {
            "@context": {
              "EXIF": "http://ns.adobe.com/EXIF/1.0/",
              "EXIFEX": "http://cipa.jp/EXIF/2.32/",
              "dc": "http://purl.org/dc/elements/1.1/",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "tiff": "http://ns.adobe.com/tiff/1.0/",
              "xmp": "http://ns.adobe.com/xap/1.0/"
            },
            "EXIF:GPSAltitude": "123.5",
            "EXIF:GPSHorizontalAccuracy": "12.2",
            "EXIF:GPSLatitude": "43.152072200000",
            "EXIF:GPSLongitude": "-77.580530000000",
            "EXIF:GPSTimeStamp": "2023-02-12T18:40:14Z"
          },
          "kind": "Json"
        },
        {
          "label": "stds.exif__1",
          "data": {
            "@context": {
              "EXIF": "http://ns.adobe.com/EXIF/1.0/",
              "EXIFEX": "http://cipa.jp/EXIF/2.32/",
              "dc": "http://purl.org/dc/elements/1.1/",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "tiff": "http://ns.adobe.com/tiff/1.0/",
              "xmp": "http://ns.adobe.com/xap/1.0/"
            },
            "EXIF:Make": "Google",
            "EXIF:Model": "Pixel 5"
          },
          "instance": 1,
          "kind": "Json"
        },
        {
          "label": "stds.exif__2",
          "data": {
            "@context": {
              "EXIF": "http://ns.adobe.com/EXIF/1.0/",
              "EXIFEX": "http://cipa.jp/EXIF/2.32/",
              "dc": "http://purl.org/dc/elements/1.1/",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "tiff": "http://ns.adobe.com/tiff/1.0/",
              "xmp": "http://ns.adobe.com/xap/1.0/"
            },
            "EXIF:DateTimeOriginal": "2023-02-12T18:40:18Z"
          },
          "instance": 2,
          "kind": "Json"
        },
        {
          "label": "com.truepic.custom.odometry",
          "data": {
            "attitude": [
              {
                "azimuth": -1.2673875,
                "pitch": 0.0050304295,
                "roll": -1.3032154,
                "timestamp": "2023-02-12T18:40:19Z"
              }
            ],
            "geomagnetism": [
              {
                "timestamp": "2023-02-12T18:40:19Z",
                "x": -40.9875,
                "y": 12.375,
                "z": -51.3375
              }
            ],
            "gravity": [
              {
                "timestamp": "2023-02-12T18:40:19Z",
                "x": 9.4504795,
                "y": -0.07717214,
                "z": 2.630324
              }
            ],
            "lens": "Back",
            "pressure": [
              {
                "timestamp": "2023-02-12T18:40:19Z",
                "value": 995.23145
              }
            ],
            "rotation_rate": [
              {
                "timestamp": "2023-02-12T18:40:19Z",
                "x": -0.014202199,
                "y": -0.02519745,
                "z": 0.01175881
              }
            ],
            "user_acceleration": [
              {
                "timestamp": "2023-02-12T18:40:19Z",
                "x": 9.633504,
                "y": -0.050249275,
                "z": 2.641078
              }
            ]
          }
        },
        {
          "label": "c2pa.hash.bmff.v2",
          "data": {
            "alg": "sha256",
            "exclusions": [
              {
                "data": [
                  {
                    "offset": 8,
                    "value": "2P7D1hsOSDySl1goh37EgQ=="
                  }
                ],
                "xpath": "/uuid"
              },
              {
                "xpath": "/ftyp"
              },
              {
                "xpath": "/mfra"
              }
            ],
            "hash": "nEzS9vlbVhdhYr8FO8gtNdLvKPaPz0iAaDj4y6Q5pV0=",
            "name": "JUMBF manifest"
          }
        },
        {
          "label": "stds.exif__3",
          "data": {
            "@context": {
              "EXIF": "http://ns.adobe.com/EXIF/1.0/",
              "EXIFEX": "http://cipa.jp/EXIF/2.32/",
              "dc": "http://purl.org/dc/elements/1.1/",
              "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
              "tiff": "http://ns.adobe.com/tiff/1.0/",
              "xmp": "http://ns.adobe.com/xap/1.0/"
            },
            "QuickTime:Duration": "7.4085"
          },
          "instance": 3,
          "kind": "Json"
        }
      ],
      "signature_info": {
        "alg": "Es256",
        "issuer": "Truepic",
        "common_name": "Truepic Lens SDK v1.1.3 in Vision Camera v3.1.5",
        "cert_serial_number": "638965998870479504364222036280408796540361537597",
        "time": "2023-02-12T18:40:19+00:00"
      },
      "label": "com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794"
    }
  },
  "validation_results": {
    "activeManifest": {
      "success": [
        {
          "code": "timeStamp.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.signature",
          "explanation": "timestamp message digest matched: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        },
        {
          "code": "claimSignature.insideValidity",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "claimSignature.validated",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.signature",
          "explanation": "claim signature valid"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/c2pa.ingredient.v3",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.ingredient.v3"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/c2pa.actions.v2",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.actions.v2"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/c2pa.hash.bmff.v3",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/c2pa.hash.bmff.v3"
        },
        {
          "code": "assertion.hashedURI.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/org.example.testing",
          "explanation": "hashed uri matched: self#jumbf=c2pa.assertions/org.example.testing"
        },
        {
          "code": "assertion.bmffHash.match",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/c2pa.hash.bmff.v3",
          "explanation": "data hash valid"
        }
      ],
      "informational": [
        {
          "code": "timeStamp.untrusted",
          "url": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.signature",
          "explanation": "timestamp cert untrusted: DigiCert SHA256 RSA4096 Timestamp Responder 2025 1"
        }
      ],
      "failure": []
    },
    "ingredientDeltas": [
      {
        "ingredientAssertionURI": "self#jumbf=/c2pa/urn:c2pa:4d988781-35f4-4142-bfd5-869b5071bf16/c2pa.assertions/c2pa.ingredient.v3",
        "validationDeltas": {
          "success": [
            {
              "code": "ingredient.manifest.validated",
              "url": "self#jumbf=/c2pa/com.truepic:urn:uuid:74b6ec09-7311-4a30-be60-76136a169794",
              "explanation": "ingredient hash matched"
            }
          ],
          "informational": [],
          "failure": []
        }
      }
    ]
  },
  "validation_state": "Valid"
}
```
