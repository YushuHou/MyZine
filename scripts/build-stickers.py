"""
素材处理：把 AI 生成的合集图（纯浅灰底）处理成小程序可用的素材分包

用法：python -I scripts/build-stickers.py scripts/packs/beach.json [--preview 预览图输出目录]

流程（详见 docs/plans/阶段8a-大海沙滩试点.md 第 2 节）：
  1. 抠背景：拟合背景灰（二次曲面），与背景色差小的大块连通区域变透明，边缘按色差渐变并去掉灰边
  2. 切图：按合集图的行列网格，把每格里的连通区域合成一个素材，裁掉空白
  3. 统一尺寸：长边不超过 maxSide
  4. 贴纸加白色描边（模切贴纸效果）
  5. 量化成 256 色调色板 PNG（保留透明）
  6. 写成分包 JS 模块：{ name: { w, h, src: Data URL } }（画布读不到分包里的图片文件，见阶段 6 验证结论）
背景纸纹：裁方 → 缩放 → 半幅错位混合消除平铺接缝 → JPG
"""
import base64
import io
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def fit_background(rgb):
    """用接近中性灰的像素拟合每个通道的二次曲面，得到整张图的背景色（兼容轻微暗角）"""
    h, w, _ = rgb.shape
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    lum = rgb.mean(axis=2)
    med = np.median(lum[sat < 8])
    cand = (sat < 8) & (np.abs(lum - med) < 12)
    ys, xs = np.nonzero(cand)
    step = max(1, len(ys) // 40000)
    ys, xs = ys[::step], xs[::step]
    def basis(y, x):
        y = y / h - 0.5
        x = x / w - 0.5
        return np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], axis=-1)
    A = basis(ys.astype(float), xs.astype(float))
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    B = basis(yy, xx)
    bg = np.empty_like(rgb)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, rgb[ys, xs, c], rcond=None)
        bg[..., c] = B @ coef
    return bg


def matte(rgb, cfg):
    """抠背景，返回 (去灰边后的颜色, alpha 0–1)"""
    bg = fit_background(rgb)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    t1, t2 = cfg.get('bgTolerance', [9, 26])
    # 背景：色差很小的大块连通区域（小块可能是物件内部的灰色，保留）
    near = dist < t1
    labels, n = ndimage.label(near)
    sizes = ndimage.sum(near, labels, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes > cfg.get('minBgArea', 1500)
    bgmask = keep[labels]
    # 只在背景边缘 3px 内按色差渐变，物件内部保持不透明
    edge = ndimage.distance_transform_edt(~bgmask) <= 3
    ramp = np.clip((dist - t1) / (t2 - t1), 0, 1)
    alpha = np.where(bgmask, 0.0, np.where(edge, ramp, 1.0))
    # 去灰边：I = a·F + (1 − a)·B → F = (I − (1 − a)·B) / a
    a = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((rgb - (1 - a) * bg) / a, 0, 255)
    return fg, alpha


def split_cells(alpha, rows, cols, min_area=40):
    """按网格把连通区域分到各格（按区域重心），返回每格的包围盒（无内容为 None）"""
    h, w = alpha.shape
    mask = alpha > 0.5
    labels, n = ndimage.label(mask)
    boxes = [None] * (rows * cols)
    objs = ndimage.find_objects(labels)
    centers = ndimage.center_of_mass(mask, labels, range(1, n + 1))
    areas = ndimage.sum(mask, labels, range(1, n + 1))
    for i in range(n):
        if areas[i] < min_area:
            continue
        cy, cx = centers[i]
        cell = min(rows - 1, int(cy / h * rows)) * cols + min(cols - 1, int(cx / w * cols))
        sl = objs[i]
        box = [sl[0].start, sl[1].start, sl[0].stop, sl[1].stop]
        if boxes[cell] is None:
            boxes[cell] = box
        else:
            b = boxes[cell]
            boxes[cell] = [min(b[0], box[0]), min(b[1], box[1]), max(b[2], box[2]), max(b[3], box[3])]
    return boxes, labels


def to_rgba(fg, alpha):
    arr = np.dstack([fg, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def add_outline(img, width, close, hole_ratio):
    """模切贴纸白边：闭运算合并相邻部件 → 填小孔 → 外扩 width px → 柔边白底垫在物件下面"""
    pad = width + close + 4
    src = Image.new('RGBA', (img.width + pad * 2, img.height + pad * 2))
    src.paste(img, (pad, pad))
    a = np.asarray(src)[..., 3] > 127
    shape = ndimage.binary_closing(a, structure=disk(close), iterations=1) | a
    # 只填小孔（如人字拖带子之间），大孔（救生圈中间）保留
    filled = ndimage.binary_fill_holes(shape)
    holes, n = ndimage.label(filled & ~shape)
    if n:
        sizes = ndimage.sum(np.ones_like(holes), holes, range(1, n + 1))
        limit = hole_ratio * shape.sum()
        small = np.zeros(n + 1, bool)
        small[1:] = sizes < limit
        shape = shape | small[holes]
    outline = ndimage.binary_dilation(shape, structure=disk(width))
    soft = Image.fromarray((outline * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new('RGBA', src.size, (255, 255, 255, 0))
    white.putalpha(soft)
    return Image.alpha_composite(white, src)


def trim(img, margin=2):
    box = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        return img
    l, t, r, b = box
    return img.crop((max(0, l - margin), max(0, t - margin), min(img.width, r + margin), min(img.height, b + margin)))


def fit_size(img, max_side):
    k = max_side / max(img.size)
    if k >= 1:
        return img
    return img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)


def png_bytes(img, colors):
    if colors:
        img = img.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    buf = io.BytesIO()
    img.save(buf, 'PNG', optimize=True)
    return buf.getvalue()


def seamless_texture(img, size):
    s = min(img.size)
    l, t = (img.width - s) // 2, (img.height - s) // 2
    img = img.convert('RGB').crop((l, t, l + s, t + s)).resize((size, size), Image.LANCZOS)
    a = np.asarray(img).astype(float)
    shifted = np.roll(a, (size // 2, size // 2), axis=(0, 1))
    # 权重：中心为 1，越靠边越接近 0；边缘处用错位图（其边缘来自原图中心，平铺时连续）
    ramp = 1 - np.abs(np.linspace(-1, 1, size))
    w = np.minimum.outer(ramp, ramp)
    w = np.clip(w * 2.2, 0, 1)[..., None]
    return Image.fromarray((a * w + shifted * (1 - w)).round().astype(np.uint8))


def build(config_path, preview_dir=None):
    with open(config_path, encoding='utf-8') as f:
        cfg = json.load(f)
    defaults = cfg.get('defaults', {})
    assets = {}
    previews = []
    for src in cfg['sources']:
        opt = dict(defaults, **src)
        image = Image.open(os.path.join(ROOT, src['file']))
        if src['kind'] == 'texture':
            tex = seamless_texture(image, opt.get('size', 1024))
            buf = io.BytesIO()
            tex.save(buf, 'JPEG', quality=opt.get('quality', 82), optimize=True, progressive=False)
            assets[src['name']] = ('jpeg', tex.size, buf.getvalue())
            previews.append((src['name'], tex.resize((256, 256))))
            continue
        rgb = np.asarray(image.convert('RGB')).astype(float)
        fg, alpha = matte(rgb, opt)
        rows, cols = src['grid']
        boxes, _ = split_cells(alpha, rows, cols)
        for i, name in enumerate(src['names']):
            if not name:
                continue
            box = boxes[i]
            if box is None:
                print(f'  ! 第 {i + 1} 格没有内容：{name}')
                continue
            t, l, b, r = box
            piece = to_rgba(fg[t:b, l:r], alpha[t:b, l:r])
            piece = fit_size(trim(piece), opt.get('maxSide', 560))
            if src['kind'] == 'sticker' and opt.get('outline'):
                piece = add_outline(piece, opt['outline'], opt.get('outlineClose', 10), opt.get('holeRatio', 0.02))
            piece = trim(piece, 1)
            assets[name] = ('png', piece.size, png_bytes(piece, opt.get('colors', 256)))
            previews.append((name, piece))

    # 写分包 JS 模块
    out = os.path.join(ROOT, cfg['out'])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    entries = []
    total = 0
    print(f'素材分包 {cfg["pack"]}：')
    for name, (fmt, (w, h), data) in assets.items():
        total += len(data)
        b64 = base64.b64encode(data).decode('ascii')
        entries.append(f'  {json.dumps(name)}: {{ w: {w}, h: {h}, src: "data:image/{fmt};base64,{b64}" }}')
        print(f'  {name:<14} {w:>4}×{h:<4} {len(data) / 1024:7.1f} KB')
    header = (f'// 素材分包「{cfg["pack"]}」：由 scripts/build-stickers.py 根据 {os.path.basename(config_path)} 生成，请勿手改\n'
              '// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里，用 require.async 加载\n')
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(header + 'module.exports = {\n' + ',\n'.join(entries) + '\n}\n')
    size = os.path.getsize(out)
    budget = cfg.get('budgetKB', 1900)
    print(f'  图片合计 {total / 1024:.0f} KB；JS 模块 {size / 1024:.0f} KB（预算 {budget} KB）')
    if size / 1024 > budget:
        print('  ! 超出预算：减少素材数量或调小 maxSide')

    if preview_dir:
        os.makedirs(preview_dir, exist_ok=True)
        contact_sheet(previews, os.path.join(preview_dir, f'{cfg["pack"]}-素材检查.png'))


def contact_sheet(items, path, cell=300, cols=6):
    """检查用拼图：上半格奶油底、下半格深色底，方便看白边和灰边"""
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, rows * cell), (60, 60, 60))
    for i, (name, img) in enumerate(items):
        x, y = (i % cols) * cell, (i // cols) * cell
        tile = Image.new('RGB', (cell, cell), (60, 60, 60))
        tile.paste(Image.new('RGB', (cell, cell // 2), (244, 236, 223)), (0, 0))
        k = min((cell - 20) / img.width, (cell - 20) / img.height)
        im = img.resize((max(1, int(img.width * k)), max(1, int(img.height * k))), Image.LANCZOS)
        if im.mode == 'RGBA':
            tile.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2), im)
        else:
            tile.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2))
        sheet.paste(tile, (x, y))
    sheet.save(path)
    print(f'  检查图：{path}')


if __name__ == '__main__':
    args = sys.argv[1:]
    preview = None
    if '--preview' in args:
        i = args.index('--preview')
        preview = args[i + 1]
        del args[i:i + 2]
    build(args[0], preview)
