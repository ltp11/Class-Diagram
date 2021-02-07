import events from '../events'
import { removeSVG } from '../util'

import { BORDER_COLOR, BORDER_WIDTH, BORDER_DASHED, WORK_STATE } from '../../constants'

import BaseAction from './base-action'
export default class PanMultiStatement extends BaseAction {
  constructor({ store, done }) {
    super({ store })
    this.store = store
    this.done = done
    this.originPoint = null
    this.shadowList = []
    this.originPos = {}
    this.actionName = '批量平移多个节点'
    this.before()
  }

  setMouseDown(point) {
    this.originPoint = point

    this.store.selectedNodes.forEach(state => {
      const shadow = new sving.Rect(state.width, state.height)
      shadow.x = state.x
      shadow.y = state.y

      shadow.setAttrs({
        fill: 'none',
        stroke: BORDER_COLOR,
        'stroke-width': BORDER_WIDTH,
        'stroke-dasharray': BORDER_DASHED,
      })

      this.store.add(shadow)
      this.shadowList.push(shadow)
    })
  }

  setMouseMove(dx, dy) {
    this.store.selectedNodes.forEach((state, i) => {
      if (this.store.workState !== WORK_STATE.PAN_MULTI_STATEMENT) return
      if (typeof dx !== 'number' || typeof dy !== 'number') return

      const shadow = this.shadowList[i]
      shadow.x += dx
      shadow.y += dy
    })
  }

  setMouseUp(point) {
    const dx = point.x - this.originPoint.x
    const dy = point.y - this.originPoint.y

    this.done()
    this.shadowList.forEach(shadow => {
      removeSVG(shadow)
    })
    this.store.selectedNodes.forEach((state, i) => {
      const shadow = this.shadowList[i]
      state.x = shadow.x
      state.y = shadow.y
      state.moveLines(dx, dy)
    })

    this.after()
    events.$emit('xClass:autoSave')
  }
}
