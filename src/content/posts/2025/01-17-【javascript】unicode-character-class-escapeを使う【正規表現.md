---
title: "【JavaScript】Unicode character class escapeを使う【正規表現】"
pubDate: 2025-01-17
categories: ["TypeScript"]
tags: []
---

こんにちは、フリーランスエンジニアのmohです。

## プロローグ

漢字とかひらがなとか、正規表現で抜き出したいなぁ。。。Unicodeテーブルから範囲を抜き出そうかな。。。そや、ChatGPTに聞いてみよう！

GPT「は？すでにあるで」

なにー

## Unicode character class escape

MDNで定義されています。

[https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Regular\_expressions/Unicode\_character\_class\_escape](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape)

```javascript
"aA".match(/\p{UppercaseLetter}/u) // "A"
```

といったように使います。

ただとにかく分かりにくいです。まとめられている所も見つかりません。ですので、今回まとめてみます。

## ライブラリにしてみた

今回のコードは、npmで公開しました。

[https://www.npmjs.com/package/@masa-dev/unicode-escapes](https://www.npmjs.com/package/@masa-dev/unicode-escapes)

必要なバリューを、定数として定義しています。使用するには、new RegExpで動的に生成する必要があります。

以下、コードです。

## Properties

### General Category

General Categoryは以下です。

```javascript
// https://unicode.org/reports/tr18/#General_Category_Property

/** General Category */
export enum GC {
  Letter = '\\p{L}',
  UppercaseLetter = '\\p{Lu}',
  LowercaseLetter = '\\p{Ll}',
  TitlecaseLetter = '\\p{Lt}',
  ModifierLetter = '\\p{Lm}',
  OtherLetter = '\\p{Lo}',
  Mark = '\\p{M}',
  NonSpacingMark = '\\p{Mn}',
  SpacingCombiningMark = '\\p{Mc}',
  EnclosingMark = '\\p{Me}',
  Number = '\\p{N}',
  DecimalDigitNumber = '\\p{Nd}',
  LetterNumber = '\\p{Nl}',
  OtherNumber = '\\p{No}',
  Symbol = '\\p{S}',
  MathSymbol = '\\p{Sm}',
  CurrencySymbol = '\\p{Sc}',
  ModifierSymbol = '\\p{Sk}',
  OtherSymbol = '\\p{So}',
  Punctuation = '\\p{P}',
  ConnectorPunctuation = '\\p{Pc}',
  DashPunctuation = '\\p{Pd}',
  OpenPunctuation = '\\p{Ps}',
  ClosePunctuation = '\\p{Pe}',
  InitialPunctuation = '\\p{Pi}',
  FinalPunctuation = '\\p{Pf}',
  OtherPunctuation = '\\p{Po}',
  Separator = '\\p{Z}',
  SpaceSeparator = '\\p{Zs}',
  LineSeparator = '\\p{Zl}',
  ParagraphSeparator = '\\p{Zp}',
  Other = '\\p{C}',
  Control = '\\p{Cc}',
  Format = '\\p{Cf}',
  Surrogate = '\\p{Cs}',
  PrivateUse = '\\p{Co}',
  Unassigned = '\\p{Cn}',
}
```

### Script Property

Scriptは以下です。

```javascript
/** Script Property */
export enum Script {
  Adlam = '\\p{Script=Adlam}',
  CaucasianAlbanian = '\\p{Script=Caucasian_Albanian}',
  Ahom = '\\p{Script=Ahom}',
  Arabic = '\\p{Script=Arabic}',
  ImperialAramaic = '\\p{Script=Imperial_Aramaic}',
  Armenian = '\\p{Script=Armenian}',
  Avestan = '\\p{Script=Avestan}',
  Balinese = '\\p{Script=Balinese}',
  Bamum = '\\p{Script=Bamum}',
  BassaVah = '\\p{Script=Bassa_Vah}',
  Batak = '\\p{Script=Batak}',
  Bengali = '\\p{Script=Bengali}',
  Bhaiksuki = '\\p{Script=Bhaiksuki}',
  Bopomofo = '\\p{Script=Bopomofo}',
  Brahmi = '\\p{Script=Brahmi}',
  Braille = '\\p{Script=Braille}',
  Buginese = '\\p{Script=Buginese}',
  Buhid = '\\p{Script=Buhid}',
  Chakma = '\\p{Script=Chakma}',
  CanadianAboriginal = '\\p{Script=Canadian_Aboriginal}',
  Carian = '\\p{Script=Carian}',
  Cham = '\\p{Script=Cham}',
  Cherokee = '\\p{Script=Cherokee}',
  Chorasmian = '\\p{Script=Chorasmian}',
  Coptic = '\\p{Script=Coptic}',
  CyproMinoan = '\\p{Script=Cypro_Minoan}',
  Cypriot = '\\p{Script=Cypriot}',
  Cyrillic = '\\p{Script=Cyrillic}',
  Devanagari = '\\p{Script=Devanagari}',
  DivesAkuru = '\\p{Script=Dives_Akuru}',
  Dogra = '\\p{Script=Dogra}',
  Deseret = '\\p{Script=Deseret}',
  Duployan = '\\p{Script=Duployan}',
  EgyptianHieroglyphs = '\\p{Script=Egyptian_Hieroglyphs}',
  Elbasan = '\\p{Script=Elbasan}',
  Elymaic = '\\p{Script=Elymaic}',
  Ethiopic = '\\p{Script=Ethiopic}',
  Georgian = '\\p{Script=Georgian}',
  Glagolitic = '\\p{Script=Glagolitic}',
  GunjalaGondi = '\\p{Script=Gunjala_Gondi}',
  MasaramGondi = '\\p{Script=Masaram_Gondi}',
  Gothic = '\\p{Script=Gothic}',
  Grantha = '\\p{Script=Grantha}',
  Greek = '\\p{Script=Greek}',
  Gujarati = '\\p{Script=Gujarati}',
  Gurmukhi = '\\p{Script=Gurmukhi}',
  Hangul = '\\p{Script=Hangul}',
  Han = '\\p{Script=Han}',
  Hanunoo = '\\p{Script=Hanunoo}',
  Hatran = '\\p{Script=Hatran}',
  Hebrew = '\\p{Script=Hebrew}',
  Hiragana = '\\p{Script=Hiragana}',
  AnatolianHieroglyphs = '\\p{Script=Anatolian_Hieroglyphs}',
  PahawhHmong = '\\p{Script=Pahawh_Hmong}',
  NyiakengPuachue_Hmong = '\\p{Script=Nyiakeng_Puachue_Hmong}',
  KatakanaOr_Hiragana = '\\p{Script=Katakana_Or_Hiragana}',
  OldHungarian = '\\p{Script=Old_Hungarian}',
  OldItalic = '\\p{Script=Old_Italic}',
  Javanese = '\\p{Script=Javanese}',
  KayahLi = '\\p{Script=Kayah_Li}',
  Katakana = '\\p{Script=Katakana}',
  Kawi = '\\p{Script=Kawi}',
  Kharoshthi = '\\p{Script=Kharoshthi}',
  Khmer = '\\p{Script=Khmer}',
  Khojki = '\\p{Script=Khojki}',
  KhitanSmall_Script = '\\p{Script=Khitan_Small_Script}',
  Kannada = '\\p{Script=Kannada}',
  Kaithi = '\\p{Script=Kaithi}',
  TaiTham = '\\p{Script=Tai_Tham}',
  Lao = '\\p{Script=Lao}',
  Latin = '\\p{Script=Latin}',
  Lepcha = '\\p{Script=Lepcha}',
  Limbu = '\\p{Script=Limbu}',
  LinearA = '\\p{Script=Linear_A}',
  LinearB = '\\p{Script=Linear_B}',
  Lisu = '\\p{Script=Lisu}',
  Lycian = '\\p{Script=Lycian}',
  Lydian = '\\p{Script=Lydian}',
  Mahajani = '\\p{Script=Mahajani}',
  Makasar = '\\p{Script=Makasar}',
  Mandaic = '\\p{Script=Mandaic}',
  Manichaean = '\\p{Script=Manichaean}',
  Marchen = '\\p{Script=Marchen}',
  Medefaidrin = '\\p{Script=Medefaidrin}',
  MendeKikakui = '\\p{Script=Mende_Kikakui}',
  MeroiticCursive = '\\p{Script=Meroitic_Cursive}',
  MeroiticHieroglyphs = '\\p{Script=Meroitic_Hieroglyphs}',
  Malayalam = '\\p{Script=Malayalam}',
  Modi = '\\p{Script=Modi}',
  Mongolian = '\\p{Script=Mongolian}',
  Mro = '\\p{Script=Mro}',
  MeeteiMayek = '\\p{Script=Meetei_Mayek}',
  Multani = '\\p{Script=Multani}',
  Myanmar = '\\p{Script=Myanmar}',
  NagMundari = '\\p{Script=Nag_Mundari}',
  Nandinagari = '\\p{Script=Nandinagari}',
  OldNorth_Arabian = '\\p{Script=Old_North_Arabian}',
  Nabataean = '\\p{Script=Nabataean}',
  Newa = '\\p{Script=Newa}',
  Nko = '\\p{Script=Nko}',
  Nushu = '\\p{Script=Nushu}',
  Ogham = '\\p{Script=Ogham}',
  OlChiki = '\\p{Script=Ol_Chiki}',
  OldTurkic = '\\p{Script=Old_Turkic}',
  Oriya = '\\p{Script=Oriya}',
  Osage = '\\p{Script=Osage}',
  Osmanya = '\\p{Script=Osmanya}',
  OldUyghur = '\\p{Script=Old_Uyghur}',
  Palmyrene = '\\p{Script=Palmyrene}',
  PauCin_Hau = '\\p{Script=Pau_Cin_Hau}',
  OldPermic = '\\p{Script=Old_Permic}',
  PhagsPa = '\\p{Script=Phags_Pa}',
  InscriptionalPahlavi = '\\p{Script=Inscriptional_Pahlavi}',
  PsalterPahlavi = '\\p{Script=Psalter_Pahlavi}',
  Phoenician = '\\p{Script=Phoenician}',
  Miao = '\\p{Script=Miao}',
  InscriptionalParthian = '\\p{Script=Inscriptional_Parthian}',
  Rejang = '\\p{Script=Rejang}',
  HanifiRohingya = '\\p{Script=Hanifi_Rohingya}',
  Runic = '\\p{Script=Runic}',
  Samaritan = '\\p{Script=Samaritan}',
  OldSouth_Arabian = '\\p{Script=Old_South_Arabian}',
  Saurashtra = '\\p{Script=Saurashtra}',
  SignWriting = '\\p{Script=SignWriting}',
  Shavian = '\\p{Script=Shavian}',
  Sharada = '\\p{Script=Sharada}',
  Siddham = '\\p{Script=Siddham}',
  Khudawadi = '\\p{Script=Khudawadi}',
  Sinhala = '\\p{Script=Sinhala}',
  Sogdian = '\\p{Script=Sogdian}',
  OldSogdian = '\\p{Script=Old_Sogdian}',
  SoraSompeng = '\\p{Script=Sora_Sompeng}',
  Soyombo = '\\p{Script=Soyombo}',
  Sundanese = '\\p{Script=Sundanese}',
  SylotiNagri = '\\p{Script=Syloti_Nagri}',
  Syriac = '\\p{Script=Syriac}',
  Tagbanwa = '\\p{Script=Tagbanwa}',
  Takri = '\\p{Script=Takri}',
  TaiLe = '\\p{Script=Tai_Le}',
  NewTai_Lue = '\\p{Script=New_Tai_Lue}',
  Tamil = '\\p{Script=Tamil}',
  Tangut = '\\p{Script=Tangut}',
  TaiViet = '\\p{Script=Tai_Viet}',
  Telugu = '\\p{Script=Telugu}',
  Tifinagh = '\\p{Script=Tifinagh}',
  Tagalog = '\\p{Script=Tagalog}',
  Thaana = '\\p{Script=Thaana}',
  Thai = '\\p{Script=Thai}',
  Tibetan = '\\p{Script=Tibetan}',
  Tirhuta = '\\p{Script=Tirhuta}',
  Tangsa = '\\p{Script=Tangsa}',
  Toto = '\\p{Script=Toto}',
  Ugaritic = '\\p{Script=Ugaritic}',
  Vai = '\\p{Script=Vai}',
  Vithkuqi = '\\p{Script=Vithkuqi}',
  WarangCiti = '\\p{Script=Warang_Citi}',
  Wancho = '\\p{Script=Wancho}',
  OldPersian = '\\p{Script=Old_Persian}',
  Cuneiform = '\\p{Script=Cuneiform}',
  Yezidi = '\\p{Script=Yezidi}',
  Yi = '\\p{Script=Yi}',
  ZanabazarSquare = '\\p{Script=Zanabazar_Square}',
  Inherited = '\\p{Script=Inherited}',
  Common = '\\p{Script=Common}',
  Unknown = '\\p{Script=Unknown}',
}
```

### Binary Unicode

Binaryも使えます

```javascript
// https://tc39.es/ecma262/multipage/text-processing.html#sec-runtime-semantics-unicodematchproperty-p

/** Binary Unicode Property */
export enum BU {
  ASCII = '\\p{ASCII}',
  ASCIIHexDigit = '\\p{ASCII_Hex_Digit}',
  Alphabetic = '\\p{Alphabetic}',
  Any = '\\p{Any}',
  Assigned = '\\p{Assigned}',
  BidiControl = '\\p{Bidi_Control}',
  BidiMirrored = '\\p{Bidi_Mirrored}',
  CaseIgnorable = '\\p{Case_Ignorable}',
  Cased = '\\p{Cased}',
  ChangesWhenCasefolded = '\\p{Changes_When_Casefolded}',
  ChangesWhenCasemapped = '\\p{Changes_When_Casemapped}',
  ChangesWhenLowercased = '\\p{Changes_When_Lowercased}',
  ChangesWhenNFKCCasefolded = '\\p{Changes_When_NFKC_Casefolded}',
  ChangesWhenTitlecased = '\\p{Changes_When_Titlecased}',
  ChangesWhenUppercased = '\\p{Changes_When_Uppercased}',
  Dash = '\\p{Dash}',
  DefaultIgnorableCodePoint = '\\p{Default_Ignorable_Code_Point}',
  Deprecated = '\\p{Deprecated}',
  Diacritic = '\\p{Diacritic}',
  Emoji = '\\p{Emoji}',
  EmojiComponent = '\\p{Emoji_Component}',
  EmojiModifier = '\\p{Emoji_Modifier}',
  EmojiModifierBase = '\\p{Emoji_Modifier_Base}',
  EmojiPresentation = '\\p{Emoji_Presentation}',
  ExtendedPictographic = '\\p{Extended_Pictographic}',
  Extender = '\\p{Extender}',
  GraphemeBase = '\\p{Grapheme_Base}',
  GraphemeExtend = '\\p{Grapheme_Extend}',
  HexDigit = '\\p{Hex_Digit}',
  IDSBinaryOperator = '\\p{IDS_Binary_Operator}',
  IDSTrinaryOperator = '\\p{IDS_Trinary_Operator}',
  IDContinue = '\\p{ID_Continue}',
  IDStart = '\\p{ID_Start}',
  Ideographic = '\\p{Ideographic}',
  JoinControl = '\\p{Join_Control}',
  LogicalOrderException = '\\p{Logical_Order_Exception}',
  Lowercase = '\\p{Lowercase}',
  Math = '\\p{Math}',
  NoncharacterCodePoint = '\\p{Noncharacter_Code_Point}',
  PatternSyntax = '\\p{Pattern_Syntax}',
  PatternWhiteSpace = '\\p{Pattern_White_Space}',
  QuotationMark = '\\p{Quotation_Mark}',
  Radical = '\\p{Radical}',
  RegionalIndicator = '\\p{Regional_Indicator}',
  SentenceTerminal = '\\p{Sentence_Terminal}',
  SoftDotted = '\\p{Soft_Dotted}',
  TerminalPunctuation = '\\p{Terminal_Punctuation}',
  UnifiedIdeograph = '\\p{Unified_Ideograph}',
  Uppercase = '\\p{Uppercase}',
  VariationSelector = '\\p{Variation_Selector}',
  WhiteSpace = '\\p{White_Space}',
  XIDContinue = '\\p{XID_Continue}',
  XIDStart = '\\p{XID_Start}',

  BasicEmoji = '\\p{Basic_Emoji}',
  EmojiKeycapSequence = '\\p{Emoji_Keycap_Sequence}',
  RGIEmojiModifierSequence = '\\p{RGI_Emoji_Modifier_Sequence}',
  RGIEmojiFlagSequence = '\\p{RGI_Emoji_Flag_Sequence}',
  RGIEmojiTagSequence = '\\p{RGI_Emoji_Tag_Sequence}',
  RGIEmojiZWJSequence = '\\p{RGI_Emoji_ZWJ_Sequence}',
  RGIEmoji = '\\p{RGI_Emoji}',
}
```
