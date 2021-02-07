import Vec2 from 'vec2'
import AdjustStatementSize from '../actions/adjust-statement-size'
import { getOppositeAdjustPoint } from '../util'

import { SIZE_POINT_WIDTH, WORK_STATE } from '../../constants'

export default class AdjustPoint extends sving.Group {
  constructor({ store, position, index }) {
    super()
    this.store = store
    this.active = false
    this.index = index

    this.mainSVG = new sving.Rect(SIZE_POINT_WIDTH, SIZE_POINT_WIDTH)
    this.mainSVG.setAttrs({
      fill: '#409EFF',
      stroke: '#409EFF',
      'stroke-width': 1,
    })
    this.x = position.x
    this.y = position.y
    this.add(this.mainSVG)
    this.initEvents()
  }

  // 获取相对stage的坐标
  getSVGposition() {
    return new Vec2(this.parent.parent.x + this.x, this.parent.parent.y + this.y)
  }

  initEvents() {
    this.on('mousedown', () => {
      if (this.store.workState === WORK_STATE.NORMAL) {
        const oppoIndex = getOppositeAdjustPoint(this.index)
        const originPoint = this.parent.parent.sizePointList.find(point => point.index === oppoIndex)

        this.store.mouseEvent = new AdjustStatementSize({
          store: this.store,
          statement: this.parent.parent,
          originPoint: originPoint.getSVGposition(),
          originPointIndex: originPoint.index,
          done: () => {
            this.store.mouseEvent = null
            this.store.workState = WORK_STATE.NORMAL
          },
        })
        this.store.workState = WORK_STATE.ADJUST_STATEMENT_SIZE

        this.store.mouseEvent.setMouseDown(this.getSVGposition())
      }
    })

    this.on('mouseover', () => {
      this.cursor = 'crosshair'
    })

    this.on('mouseout', () => {
      this.cursor = 'auto'
    })
  }
}
