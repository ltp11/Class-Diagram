import Vec2 from 'vec2/vec2'
import BaseAction from './base-action'

import { WORK_STATE } from '../../constants'

export default class PanStage extends BaseAction {
  constructor({ store, done }) {
    super({ store })
    this.store = store
    this.originPoint = null
    this.originPos = null

    this.done = done
    this.actionName = '整体平移'
    this.before()
  }

  setMouseDown(point) {
    this.store.setCursor('grabbing')
    this.originPoint = point
    this.originPos = new Vec2(this.store.x, this.store.y)
  }

  setMouseMove(point) {
    if (this.store.workState !== WORK_STATE.PAN_STAGE) return
    this.store.x = point.x - this.originPoint.x + this.originPos.x
    this.store.y = point.y - this.originPoint.y + this.originPos.y
  }

  setMouseUp() {
    this.done()
    this.after()
  }
}
