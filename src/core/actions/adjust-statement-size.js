import Vec2 from 'vec2'
import events from '../events'
import { cutLine } from '../util'

import { CLASS_WIDTH_MIN, CLASS_HEIGHT_MIN, NOTE_WIDTH_MIN, NOTE_HEIGHT_MIN } from '../../constants'

import BaseAction from './base-action'
export default class AdjustStatementSize extends BaseAction {
  constructor({ store, statement, originPoint, originPointIndex, done }) {
    super({ store })
    this.store = store
    this.statement = statement
    this.originPoint = originPoint
    this.originPointIndex = originPointIndex

    this.startPoint = null
    this.originCenter = null
    this.actionName = '调整节点大小'
    this.before()
    this.done = done
  }

  setMouseDown(point) {
    this.startPoint = point
    this.originX = this.statement.x
    this.originY = this.statement.y
    this.originWidth = this.statement.width
    this.originHeight = this.statement.height
    this.initialWidth = this.statement.width
    this.initialHeight = this.statement.height
    this.originCenter = this.statement.getCenter()

    const { startPoint, originCenter } = this
    this.signX = Math.abs(startPoint.x - originCenter.x) / (startPoint.x - originCenter.x)
    this.signY = Math.abs(startPoint.y - originCenter.y) / (startPoint.y - originCenter.y)
  }

  setMouseMove(point) {
    const dx = point.x - this.startPoint.x,
      dy = point.y - this.startPoint.y

    let width = this.initialWidth + dx * this.signX,
      height = this.initialHeight + dy * this.signY

    // width, height最小值
    const minWidth = this.statement.getMinWidth()
    const minHeight = this.statement.getMinHeight()
    if (this.statement.nodeName === 'note') {
      if (width < NOTE_WIDTH_MIN || width < minWidth) {
        width = minWidth > NOTE_WIDTH_MIN ? minWidth : NOTE_WIDTH_MIN
      }
      if (height < NOTE_HEIGHT_MIN || height < minHeight) {
        height = minHeight > NOTE_HEIGHT_MIN ? minHeight : NOTE_HEIGHT_MIN
      }
    }
    if (this.statement.nodeName === 'class') {
      if (width < CLASS_WIDTH_MIN || width < minWidth) {
        width = minWidth > CLASS_WIDTH_MIN ? minWidth : CLASS_WIDTH_MIN
      }

      if (height < CLASS_HEIGHT_MIN || height < minHeight) {
        height = minHeight > CLASS_HEIGHT_MIN ? minHeight : CLASS_HEIGHT_MIN
      }
    }

    // 先计算矩形宽高及原点坐标
    this.statement.adjustSize(width, height, this.originPoint, this.originPointIndex)
    // 再计算transition端点相对坐标
    this.updateLinesPoint(width, height)
  }

  setMouseUp() {
    this.done()
    this.after()

    this.store.transitionList.forEach(transition => {
      if (transition.fromStateId === this.statement.id || transition.toStateId === this.statement.id) {
        const { from, to } = cutLine(transition, [transition.from, transition.to])

        transition.updateFromPoint(from)
        transition.updateToPoint(to)
      }
    })

    events.$emit('xClass:autoSave', 'adjustSize')
  }

  updateLinesPoint(width, height) {
    const { id } = this.statement,
      startX = this.statement.x,
      startY = this.statement.y
    this.store.transitionList.forEach(transition => {
      ;['to', 'from'].forEach(type => {
        const state = transition[`${type}State`],
          stateId = transition[`${type}StateId`],
          updateFn = type === 'from' ? 'updateFromPoint' : 'updateToPoint'

        if (state && stateId === id) {
          const { side, percent } = this.getSideFromStateByPoint(transition[type], {
            x: this.originX,
            y: this.originY,
            width: this.originWidth,
            height: this.originHeight,
          })
          const point = this.getPointBySidePosition({ side, percent, startX, startY, width, height })
          transition[updateFn](point)
        }
      })
    })
    this.originX = startX
    this.originY = startY
    this.originWidth = width
    this.originHeight = height
  }

  /**
   * 根据交点所在的边及比例，计算出放缩后的交点位置
   * @param {*} param0
   */
  getPointBySidePosition({ side, percent, startX, startY, width, height }) {
    let x, y
    if (side === 'top') {
      x = startX + width * percent
      y = startY
    } else if (side === 'left') {
      x = startX
      y = startY + height * percent
    } else if (side === 'right') {
      x = startX + width
      y = startY + height * percent
    } else if (side === 'bottom') {
      x = startX + width * percent
      y = startY + height
    }
    return new Vec2(x, y)
  }

  /**
   * 判断点在statement的哪条边上
   * @param {*} point
   * @param {*} statement
   */
  getSideFromStateByPoint(point, statement) {
    const offset = 2
    const { x, y, width, height } = statement
    let side, percent

    if (Math.abs(point.x - x) < offset) {
      side = 'left'
      percent = (point.y - y) / height
      return { side, percent }
    } else if (Math.abs(point.y - y) < offset) {
      side = 'top'
      percent = (point.x - x) / width
      return { side, percent }
    } else if (Math.abs(point.x - (x + width)) < offset) {
      side = 'right'
      percent = (point.y - y) / height
      return { side, percent }
    } else if (Math.abs(point.y - (y + height)) < offset) {
      side = 'bottom'
      percent = (point.x - x) / width
      return { side, percent }
    } else {
      return {}
    }
  }
}
