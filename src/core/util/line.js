import Vec2 from 'vec2'
import { getSide } from './index'

// 自环起终点间隔
const POINT_GAP = 40
// 控制点偏移量
const ctrlPointOffset = 60

/**
 * 计算自环的控制点
 */
export function getSelfCtrlPoint(from, to, node) {
  const offset = 2
  // 分别是自环在上方、右方、下方、左方
  if (Math.abs(from.y - node.y) < offset && Math.abs(to.y - node.y) < offset) {
    return {
      ca: new Vec2(from.x, from.y - ctrlPointOffset),
      cb: new Vec2(to.x, to.y - ctrlPointOffset),
    }
  }
  if (Math.abs(from.x - (node.x + node.width)) < offset && Math.abs(to.x - (node.x + node.width)) < offset) {
    return {
      ca: new Vec2(from.x + ctrlPointOffset, from.y),
      cb: new Vec2(to.x + ctrlPointOffset, to.y),
    }
  }
  if (Math.abs(from.y - (node.y + node.height)) < offset && Math.abs(to.y - (node.y + node.height)) < offset) {
    return {
      ca: new Vec2(from.x, from.y + ctrlPointOffset),
      cb: new Vec2(to.x, to.y + ctrlPointOffset),
    }
  }
  if (Math.abs(from.x - node.x) < offset && Math.abs(to.x - node.x) < offset) {
    return {
      ca: new Vec2(from.x - ctrlPointOffset, from.y),
      cb: new Vec2(to.x - ctrlPointOffset, to.y),
    }
  }

  return {}
}

/**
 * 重新计算自环的位置
 * @param {*} line
 * @param {*} dx
 * @param {*} dy
 */
export function getSelfLinePoint(line, node) {
  const { x, y, width, height } = node
  let { from, to, ca, cb } = line
  const leftMinX = x
  const leftMaxX = leftMinX + width - POINT_GAP
  const rightMinX = leftMinX + POINT_GAP
  const rightMaxX = leftMinX + width
  const topMinY = y
  const topMaxY = topMinY + height - POINT_GAP
  const bottonMinY = topMinY + POINT_GAP
  const bottonMaxY = topMinY + height
  const isFromLeft = to.x - from.x
  const isFromTop = to.y - from.y

  // 分别是自环在上方、右方、下方、左方
  if (from.y - ca.y > 0) {
    from.y = y
    to.y = y
    ca.y = y - ctrlPointOffset
    cb.y = y - ctrlPointOffset
    from.x = getIntervalVal(from.x, isFromLeft ? leftMinX : rightMinX, isFromLeft ? leftMaxX : rightMaxX)
    to.x = getIntervalVal(to.x, !isFromLeft ? leftMinX : rightMinX, !isFromLeft ? leftMaxX : rightMaxX)
    ca.x = from.x
    cb.x = to.x
  } else if (from.x - ca.x < 0) {
    from.x = x + width
    to.x = x + width
    ca.x = x + width + ctrlPointOffset
    cb.x = x + width + ctrlPointOffset
    from.y = getIntervalVal(from.y, isFromTop ? topMinY : bottonMinY, isFromTop ? topMaxY : bottonMaxY)
    to.y = getIntervalVal(to.y, !isFromTop ? topMinY : bottonMinY, !isFromTop ? topMaxY : bottonMaxY)
    ca.y = from.y
    cb.y = to.y
  } else if (from.y - ca.y < 0) {
    from.y = y + height
    to.y = y + height
    ca.y = y + height + ctrlPointOffset
    cb.y = y + height + ctrlPointOffset
    from.x = getIntervalVal(from.x, isFromLeft ? leftMinX : rightMinX, isFromLeft ? leftMaxX : rightMaxX)
    to.x = getIntervalVal(to.x, !isFromLeft ? leftMinX : rightMinX, !isFromLeft ? leftMaxX : rightMaxX)
    ca.x = from.x
    cb.x = to.x
  } else if (from.x - ca.x > 0) {
    from.x = x
    to.x = x
    ca.x = x - ctrlPointOffset
    cb.x = x - ctrlPointOffset
    from.y = getIntervalVal(from.y, isFromTop ? topMinY : bottonMinY, isFromTop ? topMaxY : bottonMaxY)
    to.y = getIntervalVal(to.y, !isFromTop ? topMinY : bottonMinY, !isFromTop ? topMaxY : bottonMaxY)
    ca.y = from.y
    cb.y = to.y
  }

  return { from, to, ca, cb }
}

/**
 * 某个值落在区间则返回该值，小于最小值则返回最小值，大于最大值则返回最大值
 */
export function getIntervalVal(val, min, max) {
  if (val < min) {
    return min
  }

  if (val > max) {
    return max
  }

  return val
}

/**
 * 根据两个节点的相对位置，重新计算连线的起点和终点
 */
export function getPointLocation(line, centerLine) {
  const { fromState: fromNode, toState: toNode } = line

  const fromCenter = fromNode.getCenter()
  const fromTopLeft = { x: fromNode.x, y: fromNode.y }
  const fromTopRight = { x: fromNode.x + fromNode.width, y: fromNode.y }
  const fromBottomLeft = { x: fromNode.x, y: fromNode.y + fromNode.height }
  const fromBottomRight = { x: fromNode.x + fromNode.width, y: fromNode.y + fromNode.height }
  const fromTopLine = [fromTopLeft, fromTopRight]
  const fromRightLine = [fromTopRight, fromBottomRight]
  const fromBottomLine = [fromBottomLeft, fromBottomRight]
  const fromLeftLine = [fromTopLeft, fromBottomLeft]

  const toCenter = toNode.getCenter()
  const toTopLeft = { x: toNode.x, y: toNode.y }
  const toTopRight = { x: toNode.x + toNode.width, y: toNode.y }
  const toBottomLeft = { x: toNode.x, y: toNode.y + toNode.height }
  const toBottomRight = { x: toNode.x + toNode.width, y: toNode.y + toNode.height }
  const toTopLine = [toTopLeft, toTopRight]
  const toRightLine = [toTopRight, toBottomRight]
  const toBottomLine = [toBottomLeft, toBottomRight]
  const toLeftLine = [toTopLeft, toBottomLeft]

  centerLine = centerLine || [fromCenter, toCenter]
  let from, to

  // 分别是 toNode 在 fromNode 的左上角、右下角、左下角、右上角
  if (fromCenter.x > toCenter.x && fromCenter.y > toCenter.y) {
    from = segmentsIntr(...centerLine, ...fromTopLine) || segmentsIntr(...centerLine, ...fromLeftLine)
    to = segmentsIntr(...centerLine, ...toBottomLine) || segmentsIntr(...centerLine, ...toRightLine)
  } else if (fromCenter.x < toCenter.x && fromCenter.y < toCenter.y) {
    from = segmentsIntr(...centerLine, ...fromBottomLine) || segmentsIntr(...centerLine, ...fromRightLine)
    to = segmentsIntr(...centerLine, ...toTopLine) || segmentsIntr(...centerLine, ...toLeftLine)
  } else if (fromCenter.x > toCenter.x && fromCenter.y < toCenter.y) {
    from = segmentsIntr(...centerLine, ...fromLeftLine) || segmentsIntr(...centerLine, ...fromBottomLine)
    to = segmentsIntr(...centerLine, ...toRightLine) || segmentsIntr(...centerLine, ...toTopLine)
  } else if (fromCenter.x < toCenter.x && fromCenter.y > toCenter.y) {
    from = segmentsIntr(...centerLine, ...fromRightLine) || segmentsIntr(...centerLine, ...fromTopLine)
    to = segmentsIntr(...centerLine, ...toLeftLine) || segmentsIntr(...centerLine, ...toBottomLine)
  }

  return { from, to }
}

/**
 * 将两个节点间的连线截取到合适的长度
 */
export function cutLine(line, throughLine, endpointType) {
  const { fromState: fromNode, toState: toNode, from, to } = line
  const fromTopLeft = { x: fromNode.x, y: fromNode.y }
  const fromTopRight = { x: fromNode.x + fromNode.width, y: fromNode.y }
  const fromBottomLeft = { x: fromNode.x, y: fromNode.y + fromNode.height }
  const fromBottomRight = { x: fromNode.x + fromNode.width, y: fromNode.y + fromNode.height }
  const fromTopLine = [fromTopLeft, fromTopRight]
  const fromRightLine = [fromTopRight, fromBottomRight]
  const fromBottomLine = [fromBottomLeft, fromBottomRight]
  const fromLeftLine = [fromTopLeft, fromBottomLeft]

  const toTopLeft = { x: toNode.x, y: toNode.y }
  const toTopRight = { x: toNode.x + toNode.width, y: toNode.y }
  const toBottomLeft = { x: toNode.x, y: toNode.y + toNode.height }
  const toBottomRight = { x: toNode.x + toNode.width, y: toNode.y + toNode.height }
  const toTopLine = [toTopLeft, toTopRight]
  const toRightLine = [toTopRight, toBottomRight]
  const toBottomLine = [toBottomLeft, toBottomRight]
  const toLeftLine = [toTopLeft, toBottomLeft]

  const [throughFromPoint, throughToPoint] = throughLine

  const fromSide = getSide(throughFromPoint, fromNode)
  const toSide = getSide(throughToPoint, toNode)

  switch (fromSide) {
    case 'top':
      throughFromPoint.y = fromNode.y
      break
    case 'right':
      throughFromPoint.x = fromNode.x + fromNode.width
      break
    case 'bottom':
      throughFromPoint.y = fromNode.y + fromNode.height
      break
    case 'left':
      throughFromPoint.x = fromNode.x
      break
  }

  switch (toSide) {
    case 'top':
      throughToPoint.y = toNode.y
      break
    case 'right':
      throughToPoint.x = toNode.x + toNode.width
      break
    case 'bottom':
      throughToPoint.y = toNode.y + toNode.height
      break
    case 'left':
      throughToPoint.x = toNode.x
      break
  }

  let fromPoints = [
    segmentsIntr(...throughLine, ...fromTopLine),
    segmentsIntr(...throughLine, ...fromRightLine),
    segmentsIntr(...throughLine, ...fromBottomLine),
    segmentsIntr(...throughLine, ...fromLeftLine),
  ].filter(Boolean)
  let toPoints = [
    segmentsIntr(...throughLine, ...toTopLine),
    segmentsIntr(...throughLine, ...toRightLine),
    segmentsIntr(...throughLine, ...toBottomLine),
    segmentsIntr(...throughLine, ...toLeftLine),
  ].filter(Boolean)

  if (endpointType === 'from') {
    toPoints.push(to)
  }
  if (endpointType === 'to') {
    fromPoints.push(from)
  }

  if (toPoints.length === 0) {
    toPoints.push(throughToPoint)
  }
  if (fromPoints.length === 0) {
    fromPoints.push(throughFromPoint)
  }

  return getShortLine(fromPoints, toPoints)
}

/**
 * 计算最短线段
 */
function getShortLine(fromPoints, toPoints) {
  if (fromPoints.length === 0 || toPoints.length === 0) {
    return null
  }

  const distanceMap = {}

  fromPoints.forEach((fromPoint, i) => {
    toPoints.forEach((toPoint, j) => {
      distanceMap[`${i}_${j}`] = Math.pow(fromPoint.x - toPoint.x, 2) + Math.pow(fromPoint.y - toPoint.y, 2)
    })
  })

  let distanceMapKeys = Object.keys(distanceMap)
  let shortDistanceKey = distanceMapKeys[0]
  let shortDistance = distanceMap[shortDistanceKey]

  distanceMapKeys.forEach(key => {
    if (distanceMap[key] < shortDistance) {
      shortDistanceKey = key
      shortDistance = distanceMap[key]
    }
  })

  const [fromIndex, toIndex] = shortDistanceKey.split('_')

  return { from: fromPoints[fromIndex], to: toPoints[toIndex] }
}

/**
 * 计算线段的交点
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @param {*} d
 */
function segmentsIntr(a, b, c, d) {
  // 三角形 abc 面积的2倍
  const area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x)

  // 三角形 abd 面积的2倍
  const area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x)

  // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);
  if (area_abc * area_abd >= 0) {
    return false
  }

  // 三角形 cda 面积的2倍
  const area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x)

  // 三角形 cdb 面积的2倍
  // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.
  const area_cdb = area_cda + area_abc - area_abd

  // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);
  if (area_cda * area_cdb >= 0) {
    return false
  }

  // 计算交点坐标
  const t = area_cda / (area_abd - area_abc)
  const dx = t * (b.x - a.x),
    dy = t * (b.y - a.y)

  return { x: a.x + dx, y: a.y + dy }
}

/**
 * 计算自环时连线的起点和终点
 */
export function getSelfPointLocation(node, point) {
  const nodeCenter = node.getCenter()
  const offsetX = point.x - nodeCenter.x
  const offsetY = point.y - nodeCenter.y
  const absOffsetX = Math.abs(offsetX)
  const absOffsetY = Math.abs(offsetY)

  // 分别是 point 在 nodeCenter 的上方、右方、下方、左方
  if (offsetY <= 0 && absOffsetX <= absOffsetY) {
    return {
      from: new Vec2(nodeCenter.x, node.y),
      to: new Vec2(nodeCenter.x + POINT_GAP, node.y),
    }
  } else if (offsetX >= 0 && absOffsetY <= absOffsetX) {
    return {
      from: new Vec2(node.x + node.width, nodeCenter.y),
      to: new Vec2(node.x + node.width, nodeCenter.y + POINT_GAP),
    }
  } else if (offsetY > 0 && absOffsetX < absOffsetY) {
    return {
      from: new Vec2(nodeCenter.x, node.y + node.height),
      to: new Vec2(nodeCenter.x + POINT_GAP, node.y + node.height),
    }
  } else if (offsetX < 0 && absOffsetY < absOffsetX) {
    return {
      from: new Vec2(node.x, nodeCenter.y),
      to: new Vec2(node.x, nodeCenter.y + POINT_GAP),
    }
  }
}

/**
 * 计算连线端点移动后的坐标
 */
export function getLinePointPosition(line, dx, dy) {
  let { from, to, fromState, toState } = line

  if (fromState.id === toState.id) {
    const { x, y, width, height } = fromState
    const leftMinX = x
    const leftMaxX = leftMinX + width - POINT_GAP
    const rightMinX = leftMinX + POINT_GAP
    const rightMaxX = leftMinX + width
    const topMinY = y
    const topMaxY = topMinY + height - POINT_GAP
    const bottonMinY = topMinY + POINT_GAP
    const bottonMaxY = topMinY + height
    const isFromLeft = to.x - from.x
    const isFromTop = to.y - from.y
    const offset = 2

    // 分别是自环在上下方、左右方
    if (
      (Math.abs(from.y - fromState.y) < offset && Math.abs(to.y - fromState.y) < offset) ||
      (Math.abs(from.y - (fromState.y + fromState.height)) < offset &&
        Math.abs(to.y - (fromState.y + fromState.height)) < offset)
    ) {
      from.x += dx
      to.x += dx
      from.x = getIntervalVal(from.x, isFromLeft ? leftMinX : rightMinX, isFromLeft ? leftMaxX : rightMaxX)
      to.x = getIntervalVal(to.x, !isFromLeft ? leftMinX : rightMinX, !isFromLeft ? leftMaxX : rightMaxX)
    } else if (
      (Math.abs(from.x - fromState.x) < offset && Math.abs(to.x - fromState.x) < offset) ||
      (Math.abs(from.x - (fromState.x + fromState.width)) < offset &&
        Math.abs(to.x - (fromState.x + fromState.width)) < offset)
    ) {
      from.y += dy
      to.y += dy
      from.y = getIntervalVal(from.y, isFromTop ? topMinY : bottonMinY, isFromTop ? topMaxY : bottonMaxY)
      to.y = getIntervalVal(to.y, !isFromTop ? topMinY : bottonMinY, !isFromTop ? topMaxY : bottonMaxY)
    }
  } else {
    from = calcPointPosition(fromState, from, dx, dy)
    to = calcPointPosition(toState, to, dx, dy)

    const pointMap = getPointLocation(line, [from, to])
    from = pointMap.from || from
    to = pointMap.to || to
  }

  return { from, to }
}

/**
 * 计算点平移后的实际坐标
 * @param {*} node
 * @param {*} point
 * @param {*} dx
 * @param {*} dy
 */
function calcPointPosition(node, point, dx, dy) {
  const minX = node.x
  const maxX = node.x + node.width
  const minY = node.y
  const maxY = node.y + node.height

  point.x += dx
  point.y += dy

  if (point.x < minX) {
    point.x = minX
  }
  if (point.x > maxX) {
    point.x = maxX
  }

  if (point.y < minY) {
    point.y = minY
  }
  if (point.y > maxY) {
    point.y = maxY
  }

  return point
}

/**
 * 计算自环的箭头角度
 */
export function getSelfArrowRotation(line) {
  let { from, ca } = line
  const offset = 2

  // 分别是自环在上方、右方、下方、左方
  if (from.y - ca.y > offset) {
    return 90
  } else if (ca.x - from.x > offset) {
    return 180
  } else if (ca.y - from.y > offset) {
    return 270
  } else if (from.x - ca.x > offset) {
    return 0
  }
}
