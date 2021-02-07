import Vec2 from 'vec2'
import events from '../events'
import { removeSVG } from '../util'

import { BORDER_COLOR, BORDER_WIDTH, BORDER_DASHED, WORK_STATE } from '../../constants'

import BaseAction from './base-action'
export default class PanStatement extends BaseAction {
  constructor({ store, statement, done }) {
    super({ store })
    this.statement = statement
    this.originPoint = null
    this.shadow = null
    this.done = done
    this.actionName = '修改节点坐标'
    this.beforePoint = new Vec2(this.statement.x, this.statement.y)
    this.before()
  }

  setMouseDown(point) {
    this.originPoint = point

    this.shadow = new sving.Rect(this.statement.width, this.statement.height)
    this.shadow.x = this.statement.x
    this.shadow.y = this.statement.y

    this.shadow.setAttrs({
      fill: 'none',
      stroke: BORDER_COLOR,
      'stroke-width': BORDER_WIDTH,
      'stroke-dasharray': BORDER_DASHED,
    })

    this.store.add(this.shadow)
  }

  setMouseMove(dx, dy) {
    if (this.store.workState !== WORK_STATE.PAN_STATEMENT) return
    if (typeof dx !== 'number' || typeof dy !== 'number') return

    const mouseX = this.shadow.x + dx
    const mouseY = this.shadow.y + dy

    this.shadow.x = mouseX
    this.shadow.y = mouseY
  }

  setMouseUp(point) {
    removeSVG(this.shadow)
    const dx = point.x - this.originPoint.x
    const dy = point.y - this.originPoint.y

    this.done()

    this.statement.x = this.shadow.x
    this.statement.y = this.shadow.y
    this.statement.moveLines(dx, dy)

    this.afterPoint = new Vec2(this.statement.x, this.statement.y)
    const moveDistance = this.beforePoint.distance(this.afterPoint)
    if (moveDistance > 1) {
      events.$emit('xClass:autoSave')
      setTimeout(() => {
        this.after()
      }, 100)
    }
  }
}
