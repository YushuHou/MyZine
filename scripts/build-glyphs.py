"""
生成字形路径数据（开发时运行，不进小程序包）

用法：python scripts/build-glyphs.py <字体源目录>
  字体源目录中放 Google Fonts 官方仓库下载的可变字体：
    Caveat[wght].ttf、PlayfairDisplay[wght].ttf、Oswald[wght].ttf
输出：pkg-fonts/{playfair,caveat,oswald}.js

原因：iPhone 上 wx.loadFontFace 注册的字体不能用于 canvas 2d（见 docs/plans/阶段6.md），
所以把字形轮廓导出为 SVG 路径，由 core/render/glyphText.js 直接画到画布上。
OFL 保留名称条款：转换后的数据使用 MZ 前缀名称。
"""
import io
import json
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# 基本拉丁字母、数字、常用标点 + 弯引号、破折号、省略号、间隔号、项目符号、度数
CHARS = [chr(c) for c in range(0x20, 0x7F)] + list('\u2018\u2019\u201C\u201D\u2013\u2014\u2026\u00B7\u2022\u00B0')

FONTS = [
    # key, 源文件, 字重, MZ 名称, 原字体名, 来源
    ('playfair', 'PlayfairDisplay[wght].ttf', 400, 'MZ Playfair', 'Playfair Display', 'https://github.com/google/fonts/tree/main/ofl/playfairdisplay'),
    ('caveat', 'Caveat[wght].ttf', 500, 'MZ Caveat', 'Caveat', 'https://github.com/google/fonts/tree/main/ofl/caveat'),
    ('oswald', 'Oswald[wght].ttf', 600, 'MZ Oswald', 'Oswald', 'https://github.com/google/fonts/tree/main/ofl/oswald'),
]


def kerning_pairs(font, cmap, chars):
    """从 GPOS 的 kern 特性中取出这些字符两两之间的字距（字体单位），只保留非 0 的"""
    if 'GPOS' not in font:
        return {}
    gpos = font['GPOS'].table
    lookup_ids = []
    for rec in gpos.FeatureList.FeatureRecord:
        if rec.FeatureTag == 'kern':
            lookup_ids += rec.Feature.LookupListIndex
    glyph_of = {ch: cmap[ord(ch)] for ch in chars if ord(ch) in cmap}
    pairs = {}
    for li in sorted(set(lookup_ids)):
        lookup = gpos.LookupList.Lookup[li]
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) != 2 and lookup.LookupType not in (2, 9):
                continue
            for a, ga in glyph_of.items():
                if ga not in st.Coverage.glyphs:
                    continue
                for b, gb in glyph_of.items():
                    key = a + b
                    if key in pairs:
                        continue  # 先出现的查找表优先
                    value = None
                    if st.Format == 1:
                        ps = st.PairSet[st.Coverage.glyphs.index(ga)]
                        for pvr in ps.PairValueRecord:
                            if pvr.SecondGlyph == gb:
                                value = getattr(pvr.Value1, 'XAdvance', 0) if pvr.Value1 else 0
                                break
                    elif st.Format == 2:
                        c1 = st.ClassDef1.classDefs.get(ga, 0)
                        c2 = st.ClassDef2.classDefs.get(gb, 0)
                        rec = st.Class1Record[c1].Class2Record[c2]
                        value = getattr(rec.Value1, 'XAdvance', 0) if rec.Value1 else 0
                    if value is not None:
                        pairs[key] = value
    return {k: v for k, v in pairs.items() if v}


def build(src_dir, out_dir):
    for key, file, wght, mz_name, orig_name, url in FONTS:
        font = instancer.instantiateVariableFont(TTFont(os.path.join(src_dir, file)), {'wght': wght})
        glyph_set = font.getGlyphSet()
        cmap = font.getBestCmap()
        upm = font['head'].unitsPerEm
        hhea = font['hhea']
        glyphs = {}
        for ch in CHARS:
            gname = cmap.get(ord(ch))
            if not gname:
                continue
            pen = SVGPathPen(glyph_set, ntos=lambda v: str(round(v)))
            # 字体坐标 y 向上，画布 y 向下：上下翻转，基线在 y = 0
            glyph_set[gname].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))
            glyphs[ch] = [glyph_set[gname].width, pen.getCommands()]
        kern = kerning_pairs(font, cmap, [c for c in CHARS if c in glyphs])
        data = {
            'name': mz_name,
            'unitsPerEm': upm,
            'ascent': hhea.ascent,
            'descent': hhea.descent,
            'glyphs': glyphs,
            'kern': kern,
        }
        header = (
            f'// {mz_name}：由 {orig_name}（SIL Open Font License 1.1）转换的字形路径数据\n'
            f'// 来源：{url}；字重 {wght}；仅含基本拉丁字母、数字和常用标点\n'
            f'// 依 OFL 保留名称条款使用 MZ 前缀名称；授权全文见 licenses/fonts/ 与小程序内「字体授权」页\n'
            f'// 由 scripts/build-glyphs.py 生成，请勿手改\n'
        )
        body = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        out = os.path.join(out_dir, f'{key}.js')
        io.open(out, 'w', encoding='utf-8', newline='').write(header + 'module.exports = ' + body + '\n')
        print(f'{mz_name}: {len(glyphs)} 字形, {len(kern)} 字距对, {os.path.getsize(out)} 字节')


if __name__ == '__main__':
    build(sys.argv[1], os.path.join(os.path.dirname(__file__), '..', 'pkg-fonts'))
