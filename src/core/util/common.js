import { v4 as uuid } from 'uuid'
import Vec2 from 'vec2'

import { WORK_STATE, ADJUST_POINT_INDEX } from '../../constants'

/**
 * 获得 stage 中心坐标
 */
export function getStageCenterPagePostion() {
  const { top, left, width, height } = window.stage.el.getBoundingClientRect()

  return {
    x: left + width / 2,
    y: top + height / 2,
  }
}

/**
 * 移除 svg 节点
 */
export function removeSVG(node) {
  if (node.el && node.el.parentNode) {
    node.el.parentNode.removeChild(node.el)
  }
}

/**
 * 获取对角线的调整点的 index
 * @param {String} index
 */
export function getOppositeAdjustPoint(index) {
  switch (index) {
    case ADJUST_POINT_INDEX.LEFT_TOP:
      return ADJUST_POINT_INDEX.RIGHT_BOTTOM
    case ADJUST_POINT_INDEX.RIGHT_TOP:
      return ADJUST_POINT_INDEX.LEFT_BOTTOM
    case ADJUST_POINT_INDEX.RIGHT_BOTTOM:
      return ADJUST_POINT_INDEX.LEFT_TOP
    case ADJUST_POINT_INDEX.LEFT_BOTTOM:
      return ADJUST_POINT_INDEX.RIGHT_TOP
  }
}

/**
 * 获取鼠标相对页面的点坐标
 * @param {*} e 鼠标事件参数event
 */
export function getPagePointPosition(e) {
  return new Vec2(e.pageX, e.pageY)
}

/**
 * 获取鼠标相对组件的坐标
 * @param {*} e
 */
export function getContainerPointPosition(stage, e) {
  const clientRect = stage.el.getBoundingClientRect()
  return new Vec2(e.pageX - clientRect.left, e.pageY - clientRect.top)
}

/**
 * 获取鼠标相对stage原点上的点坐标
 * @param {*} stage
 * @param {*} e
 */
export function getStagePointPosition(stage, point) {
  const store = stage.children[0]
  let origin = new Vec2(0, 0)
  const clientRect = stage.el.getBoundingClientRect()
  const { scale } = store
  if (store.workState === WORK_STATE.PAN_STAGE) {
    return new Vec2(point.x - clientRect.left - origin.x, point.y - clientRect.top - origin.y)
  } else {
    origin = new Vec2(store.x, store.y)
    return new Vec2((point.x - clientRect.left - origin.x) / scale, (point.y - clientRect.top - origin.y) / scale)
  }
}

/**
 * 点是否在stage上
 * @param {*} stage
 * @param {*} point
 */
export function isInStage(stage, point) {
  const clientRect = stage.el.getBoundingClientRect()
  const { left, top, right, bottom } = clientRect
  const { x, y } = point
  return left < x && top < y && right > x && bottom > y
}

/**
 * 获取唯一id
 * @param {*} prefix
 */
export function getId(prefix) {
  return `${prefix}-${uuid()}`
}

/**
 * 次方公式
 * @param {*} base
 * @param {*} ex
 */
export function pow(base, ex) {
  return Math.pow(base, ex)
}

/**
 * 获取贝塞尔曲线点位置
 * @param {*} from
 * @param {*} to
 * @param {*} ca
 * @param {*} cb
 * @param {*} percent
 */
export function getBezierPoint(from, to, ca, cb, percent) {
  const x =
    from.x * pow(1 - percent, 3) +
    3 * ca.x * percent * pow(1 - percent, 2) +
    3 * cb.x * pow(percent, 2) * (1 - percent) +
    to.x * pow(percent, 3)

  const y =
    from.y * pow(1 - percent, 3) +
    3 * ca.y * percent * pow(1 - percent, 2) +
    3 * cb.y * pow(percent, 2) * (1 - percent) +
    to.y * pow(percent, 3)
  return { x, y }
}

/**
 * 获取直线斜率
 */
export function getLineSlope(from, to) {
  return (to.y - from.y) / (to.x - from.x)
}

// 计算箭头旋转角度
export function getArrowRotation(from, to) {
  const slope = getLineSlope(from, to)
  let angle = (Math.atan(slope) * 180) / Math.PI

  if (from.x > to.x) {
    angle += 180
  }

  return angle
}

/**
 * 圆和连接圆心和圆外一点线段的交点
 * 解方程
 * (x - roundCenter.x)^2 + (y - roundCenter.y)^2 = radius^2
 * (y - roundCenter.y) = (roundCenter.y - linePoint.y)/(roundCenter.x - linePoint.x) * (x - roundCenter.x)
 * @param {*} roundCenter  圆心
 * @param {*} outerPoint  圆外一点
 * @param {*} radius  圆半径
 * @return point
 *
 */
export function getPointByRoundAndLine(roundCenter, outerPoint, radius) {
  // 斜率
  const k = getLineSlope(roundCenter, outerPoint)
  const r2 = Math.pow(radius, 2)
  let x, y
  // 第一个解
  x = Math.sqrt(r2 / (1 + Math.pow(k, 2))) + roundCenter.x
  y = k * (x - roundCenter.x) + roundCenter.y
  if (isPointInSegment(x, y, roundCenter, outerPoint)) {
    return new Vec2(x, y)
  }

  // 第二个解
  x = -Math.sqrt(r2 / (1 + Math.pow(k, 2))) + roundCenter.x
  y = k * (x - roundCenter.x) + roundCenter.y
  if (isPointInSegment(x, y, roundCenter, outerPoint)) {
    return new Vec2(x, y)
  }
}

/**
 * 矩形和连接矩形内及矩形外一点线段的交点
 * @param {*} rectStart 矩形左上角起点
 * @param {*} width  长
 * @param {*} height  宽
 * @param {*} outerPoint 矩形外一点
 * @param {*} innerPoint 矩形内一点
 */
export function getPointByRectAndLine(rectStart, width, height, outerPoint, innerPoint) {
  const k = getLineSlope(outerPoint, innerPoint)
  let x, y

  // 若线段和top边相交
  y = rectStart.y
  x = (y - innerPoint.y) / k + innerPoint.x
  if (isNumInRange(x, [rectStart.x, rectStart.x + width]) && isPointInSegment(x, y, outerPoint, innerPoint)) {
    return new Vec2(x, y)
  }

  // 若线段和right边相交
  x = rectStart.x + width
  y = k * (x - innerPoint.x) + innerPoint.y
  if (isNumInRange(y, [rectStart.y, rectStart.y + height]) && isPointInSegment(x, y, outerPoint, innerPoint)) {
    return new Vec2(x, y)
  }

  // 若线段和bottom边相交
  y = rectStart.y + height
  x = (y - innerPoint.y) / k + innerPoint.x
  if (isNumInRange(x, [rectStart.x, rectStart.x + width]) && isPointInSegment(x, y, outerPoint, innerPoint)) {
    return new Vec2(x, y)
  }

  // 若线段和left边相交
  x = rectStart.x
  y = k * (x - innerPoint.x) + innerPoint.y
  if (isNumInRange(y, [rectStart.y, rectStart.y + height]) && isPointInSegment(x, y, outerPoint, innerPoint)) {
    return new Vec2(x, y)
  }
  return new Vec2(x, y)
}

/**
 * 判断点是否在一条线段上
 * @param {*} x 点x坐标
 * @param {*} y 点y坐标
 * @param {*} point1 线段端点1
 * @param {*} point2 线段端点2
 */
export function isPointInSegment(x, y, point1, point2) {
  return (
    Math.min(point1.x, point2.x) <= x &&
    Math.max(point1.x, point2.x) >= x &&
    Math.min(point1.y, point2.y) <= y &&
    Math.max(point1.y, point2.y) >= y
  )
}

/**
 * 判断点在statement的哪条边上
 * @param {*} point
 * @param {*} statement
 */
export function getSideFromStateByPoint(point, statement) {
  const { x, y, width, height } = statement
  const side = getSide(point, statement)
  let percent = 0.5

  if (side === 'left') {
    percent = (point.y - y) / height
  } else if (side === 'top') {
    percent = (point.x - x) / width
  } else if (side === 'right') {
    percent = (point.y - y) / height
  } else if (side === 'bottom') {
    percent = (point.x - x) / width
  }

  return { side, percent }
}

/**
 * 判断点在矩形的哪个方向
 */
export function getSide(point, node) {
  const origin = new Vec2(node.x, node.y)
  const nodeCenter = node.getCenter()
  const diagonalSlope = Math.abs(getLineSlope(origin, nodeCenter))
  const pointSlop = Math.abs(getLineSlope(point, nodeCenter))

  // 分别位于上方、右方、下方、左方
  if (point.y < nodeCenter.y && pointSlop >= diagonalSlope) {
    return 'top'
  } else if (point.x > nodeCenter.x && pointSlop <= diagonalSlope) {
    return 'right'
  } else if (point.y > nodeCenter.y && pointSlop >= diagonalSlope) {
    return 'bottom'
  } else if (point.x < nodeCenter.x && pointSlop <= diagonalSlope) {
    return 'left'
  }
}

//两点之间插值
export function lerp(p1, p2, t) {
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }
}

//de Casteljau 算法
export function dca(points, t) {
  let len = points.length

  if (len === 2) {
    return lerp(points[0], points[1], t)
  }

  let i = 0,
    next = []
  for (; i < len - 1; i++) {
    next.push(lerp(points[i], points[i + 1], t))
  }

  return dca(next, t)
}

//求切线
export function slope(points, t) {
  const p1x = points[0],
    p1y = points[1],
    c1x = points[2],
    c1y = points[3],
    c2x = points[4],
    c2y = points[5],
    p2x = points[6],
    p2y = points[7]
  const t1 = 1 - t
  const t1Sqr = t1 * t1
  const tSqr = t * t

  const dx = -3 * t1Sqr * p1x + 3 * t1Sqr * c1x - 6 * t * t1 * c1x - 3 * tSqr * c2x + 6 * t * t1 * c2x + 3 * tSqr * p2x
  const dy = -3 * t1Sqr * p1y + 3 * t1Sqr * c1y - 6 * t * t1 * c1y - 3 * tSqr * c2y + 6 * t * t1 * c2y + 3 * tSqr * p2y
  return Math.atan2(dy, dx)
}

//或者贝塞尔曲线上的值
export function getValue(from, ca, cb, to, t) {
  return dca([from, ca, cb, to], t)
}

// steps 根据起点和终点自动计算？
export function getLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, steps) {
  //steps越大越准确，但是计算量越大
  let step = 1 / steps
  let points = []

  let len = 0
  for (let t = 0; t < 1.0 + step; t += step) {
    points.push(getValue(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, Math.min(t, 1)))
  }
  let p0, p1, dx, dy
  for (let i = 0; i < points.length - 1; i++) {
    p0 = points[i]
    p1 = points[i + 1]
    dx = p1.x - p0.x
    dy = p1.y - p0.y
    len += Math.sqrt(dx * dx + dy * dy)
  }

  return len
}

/**
 * 判断数字是否在区间内
 * @param {*} num 数值
 * @param {*} range [min, max]
 */
export function isNumInRange(num, range) {
  const [min, max] = range
  return min <= num && num <= max
}

const REG_HEX = /(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i

/*
 * rgb字符串解析
 * accepts: #333 #accded (without # is also fine)
 * not accept yet: rgb(), rgba()
 */
export function parseRGB(str) {
  if (typeof str === 'string' && REG_HEX.test(str)) {
    str = str.replace('#', '')
    let arr
    if (str.length === 3) {
      arr = str.split('').map(c => c + c)
    } else if (str.length === 6) {
      arr = str.match(/[a-zA-Z0-9]{2}/g)
    } else {
      throw new Error('wrong color format')
    }
    return arr.map(c => parseInt(c, 16))
  }
  throw new Error('color should be string')
}

/*
 * rgb value to hsl 色相(H)、饱和度(S)、明度(L)
 */
function rgbToHsl(rgbStr) {
  let [r, g, b] = parseRGB(rgbStr)
  ;(r /= 255), (g /= 255), (b /= 255)
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h,
    s,
    l = (max + min) / 2

  if (max == min) {
    h = s = 0 // achromatic
  } else {
    let d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h, s, l]
}

/*
 * 判断颜色属于深色还是浅色
 */
export function isColorDarkOrLight(rgbStr) {
  let [h, s, l] = rgbToHsl(rgbStr)
  return l > 0.5 ? 'light' : 'dark'
}

export function isEmpty(obj) {
  const { toString } = Object.prototype

  if (obj === null || obj === undefined) {
    return true
  }

  if (toString.call(obj) === '[object String]') {
    return obj === ''
  }

  if (toString.call(obj) === '[object Array]') {
    return obj.length === 0
  }

  if (toString.call(obj) === '[object Object]') {
    return Object.keys(obj).length === 0
  }
}

/**
 * 将 SVG 导出为图片
 * @param {*} node
 * @param {*} name
 * @param {*} width
 * @param {*} height
 * @param {*} type
 */
export const covertSVG2Image = (node, name, width, height, type = 'png') => {
  console.log('node, name, width, height, type', node, name, width, height, type)
  let serializer = new XMLSerializer()
  let source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(node)
  console.log('source', source)
  let image = new Image()
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
  let canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  let context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, 10000, 10000)
  image.onload = function() {
    context.drawImage(image, 0, 0)
    let a = document.createElement('a')
    a.download = `${name}.${type}`
    a.href = canvas.toDataURL(`image/${type}`)
    a.click()
  }
}
