import Vec2 from 'vec2'
import { getId, getPointByRectAndLine, cutLine, isNumInRange } from '../util'

import { WORK_STATE, SIZE_POINT_WIDTH, ADJUST_POINT_INDEX, MOUSE } from '../../constants'

import events from '../events'

import PanStatement from '../actions/pan-statement'
import PanMultiStatement from '../actions/pan-multi-statement'
import AdjustPoint from './adjust-point'
import StateBoard from './stateboard'

export default class BaseGroup extends sving.Group {
  constructor({ x, y, width, height, id = getId('statement'), store, isNeedEvent = true }) {
    super()

    this.id = id
    this.store = store

    this.x = x
    this.y = y

    this.width = width
    this.height = height

    isNeedEvent && this.initEvent()
  }

  initEvent() {
    this.initBaseClick()
    this.initDrag()

    // 移入时展示右上角小箭头
    this.on('mouseover', () => {
      this.stateBoard && this.stateBoard.show()
    })

    // 移出时隐藏右上角小箭头
    this.on('mouseout', () => {
      if (!this.isActive && this.stateBoard) {
        this.stateBoard.hide()
      }
    })
  }

  initBaseClick() {
    this.on('mousedown', e => {
      this.which = e.which
    })

    this.on('mouseup', e => {
      this.which = e.which
    })

    this.on('click', e => {
      e.stopPropagation()
    })

    this.on('dblclick', e => {
      e.stopPropagation()
    })

    this.on('contextmenu', e => {
      e.stopPropagation()
      e.preventDefault()
    })
  }

  initDrag() {
    const bindDragStart = () => {
      if (this.which !== MOUSE.LEFT) return

      if (
        this.store.selectedNodes.length > 1 &&
        this.store.workState !== WORK_STATE.SHIFT_MULTI_SELECTING &&
        this.store.workState !== WORK_STATE.PAN_STAGE &&
        this.store.selectedNodes.find(node => node === this)
      ) {
        this.store.workState = WORK_STATE.PAN_MULTI_STATEMENT
        this.store.mouseEvent = new PanMultiStatement({
          store: this.store,
          done: () => {
            this.store.mouseEvent = null
            this.store.workState = WORK_STATE.AFTER_PAN_MULTI_STATEMENT
          },
        })
        return
      }

      if (this.store.workState === WORK_STATE.NORMAL) {
        this.store.mouseEvent = new PanStatement({
          store: this.store,
          statement: this,
          done: callback => {
            this.store.mouseEvent = null
            this.store.workState = WORK_STATE.NORMAL
            callback && callback()
          },
        })
        this.store.workState = WORK_STATE.PAN_STATEMENT
      }
    }

    const bindDrag = (dx, dy) => {
      if (this.which !== MOUSE.LEFT) return

      if (this.store.workState === WORK_STATE.PAN_MULTI_STATEMENT) {
        const { scale } = this.store

        this.store.mouseEvent.setMouseMove(dx / scale, dy / scale)
      }

      if (this.store.workState === WORK_STATE.PAN_STATEMENT) {
        const { scale } = this.store

        this.store.mouseEvent.setMouseMove(dx / scale, dy / scale)
      }
    }

    const bindDragEnd = () => {
      // 已在 store 中全局监听
      // if (this.store.workState === WORK_STATE.PAN_STATEMENT) {
      //   this.store.mouseEvent.setMouseUp()
      // }
      // if (this.store.workState === WORK_STATE.PAN_MULTI_STATEMENT) {
      //   this.store.mouseEvent.setMouseUp()
      // }
    }

    this.onDragStart(bindDragStart)
    this.onDrag(bindDrag)
    this.onDragEnd(bindDragEnd)
  }

  /**
   * 平移statement时，同步平移transition
   */
  moveLines(dx, dy) {
    this.store.transitionList.forEach(transition => {
      if (transition.fromStateId === this.id && transition.toStateId === this.id) {
        const { from, to } = transition

        transition.updateFromPoint({ x: from.x + dx, y: from.y + dy })
        transition.updateToPoint({ x: to.x + dx, y: to.y + dy })
      } else if (transition.fromStateId === this.id) {
        const throughLine = [{ x: transition.from.x + dx, y: transition.from.y + dy }, transition.to]
        const { from, to } = cutLine(transition, throughLine)

        transition.updateFromPoint(from)
        transition.updateToPoint(to)
      } else if (transition.toStateId === this.id) {
        const throughLine = [transition.from, { x: transition.to.x + dx, y: transition.to.y + dy }]
        const { from, to } = cutLine(transition, throughLine)

        transition.updateFromPoint(from)
        transition.updateToPoint(to)
      }
    })
  }

  isPointIn(point) {
    const isIn = point.x > this.x && point.y > this.y && point.x < this.x + this.width && point.y < this.y + this.height
    return isIn
  }

  getIntersection(outerPoint, innerPoint) {
    const rectStart = new Vec2(this.x, this.y)
    if (!innerPoint) {
      innerPoint = this.getCenter()
    }
    return getPointByRectAndLine(rectStart, this.width, this.height, outerPoint, innerPoint)
  }

  getCenter() {
    return new Vec2(this.x + this.width / 2, this.y + this.height / 2)
  }

  initToolBoard() {
    this.stateBoard = new StateBoard({
      store: this.store,
      position: {
        x: this.width,
        y: 0,
      },
    })
    this.add(this.stateBoard)
  }

  initSizePoints() {
    const sizePoints = this.initSizePointDataModel()

    this.controlPointsGroup = new sving.Group()

    sizePoints.forEach(sizePointData => {
      const options = { ...sizePointData, store: this.store }
      const adjustPoint = new AdjustPoint(options)

      this.controlPointsGroup.add(adjustPoint)
      this.sizePointList.push(adjustPoint)
    })
  }

  initSizePointDataModel() {
    const { width, height } = this
    const offset = SIZE_POINT_WIDTH / 2

    return [
      { position: { x: -offset, y: 0 - offset }, index: ADJUST_POINT_INDEX.LEFT_TOP },
      { position: { x: width - offset, y: 0 - offset }, index: ADJUST_POINT_INDEX.RIGHT_TOP },
      { position: { x: width - offset, y: height - offset }, index: ADJUST_POINT_INDEX.RIGHT_BOTTOM },
      { position: { x: 0 - offset, y: height - offset }, index: ADJUST_POINT_INDEX.LEFT_BOTTOM },
    ]
  }

  // 更新调整点坐标
  updatePoints({ width, height }) {
    const offset = SIZE_POINT_WIDTH / 2
    this.sizePointList.forEach(point => {
      if (point.index === ADJUST_POINT_INDEX.LEFT_TOP) {
        point.x = -offset
        point.y = -offset
        return
      }
      if (point.index === ADJUST_POINT_INDEX.RIGHT_TOP) {
        point.x = width - offset
        point.y = -offset
        return
      }
      if (point.index === ADJUST_POINT_INDEX.LEFT_BOTTOM) {
        point.x = -offset
        point.y = height - offset
        return
      }
      if (point.index === ADJUST_POINT_INDEX.RIGHT_BOTTOM) {
        point.x = width - offset
        point.y = height - offset
        return
      }
    })
  }

  isPointInSide(point) {
    const { x, y, width, height } = this
    // 允许的误差区间
    const difference = 2

    // 判断top边
    if (isNumInRange(point.x, [x, x + width]) && isNumInRange(point.y, [y - difference, y + difference])) {
      return new Vec2(point.x, y)
    }
    // 判断bottom边
    if (isNumInRange(point.x, [x, x + width]) && isNumInRange(point.y, [y + height - difference, y + height + difference])) {
      return new Vec2(point.x, y + height)
    }
    // 判断left边
    if (isNumInRange(point.x, [x - difference, x + difference]) && isNumInRange(point.y, [y, y + height])) {
      return new Vec2(x, point.y)
    }
    // 判断right边
    if (isNumInRange(point.x, [x + width - difference, x + width + difference]) && isNumInRange(point.y, [y, y + height])) {
      return new Vec2(x + width, point.y)
    }
    return null
  }
}
