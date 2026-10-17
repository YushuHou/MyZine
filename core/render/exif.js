// EXIF 方向处理（取值为 wx.getImageInfo 返回的 orientation 字段）

// 需要旋转 90° 才能正确显示的方向：读取到的宽高需要交换
const ROTATED_90 = ['left', 'right', 'left-mirrored', 'right-mirrored']

function isRotated90(exif) {
  return ROTATED_90.indexOf(exif) >= 0
}

// 按 EXIF 方向设置画布变换，调用前需把原点移到照片中心
// 注意 canvas 变换后调用的先作用于图形：先 rotate 再 scale 表示「先镜像、后旋转」
function applyExifTransform(ctx, exif) {
  switch (exif) {
    case 'up-mirrored': ctx.scale(-1, 1); break
    case 'down': ctx.rotate(Math.PI); break
    case 'down-mirrored': ctx.scale(1, -1); break
    case 'left-mirrored': ctx.rotate(-Math.PI / 2); ctx.scale(-1, 1); break
    case 'right': ctx.rotate(Math.PI / 2); break
    case 'right-mirrored': ctx.rotate(Math.PI / 2); ctx.scale(-1, 1); break
    case 'left': ctx.rotate(-Math.PI / 2); break
    default: break
  }
}

module.exports = { isRotated90, applyExifTransform }
