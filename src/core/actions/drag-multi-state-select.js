import Vec2 from "vec2/vec2"

export default class DragMultiStateSelect {
  constructor({ store, done }) {
    this.store = store
    this.done = done
    this.originPoint = null
    this.rect = null
  }
  
  setMouseDown(point) {
    // this.store.setAllNormal()
    this.store.selectedNodes.forEach(state => state.setActive(false))
    this.store.selectedNodes = []

    this.originPoint = point
    this.rect = new sving.Rect(0,0)
    this.rect.x = point.x
    this.rect.y = point.y
    this.rect.setAttrs({
      stroke: '#409EFF',
      fill: 'transparent',
      'stroke-dasharray': '5,5'
    })
    this.store.add(this.rect)
  }

  setMouseMove(point) {
    let width = point.x - this.originPoint.x
    let height = point.y - this.originPoint.y

    if (width < 0) {
      this.rect.x = this.originPoint.x + width
    }
    if (height < 0) {
      this.rect.y = this.originPoint.y + height
    }

    width = Math.abs(width)
    height = Math.abs(height)

    this.rect.width = width
    this.rect.height = height

    this.rect.setAttrs({
      width,
      height
    })
  }

  setMouseUp(point) {
    const stateList = this.store.statementList
    const x1 = this.rect.x
    const y1 = this.rect.y
    const x2 = this.rect.x + this.rect.width
    const y2 = this.rect.y + this.rect.height
    // const rectLeftTop = new Vec2(this.rect.x, this.rect.y)
    // 
    const selected = stateList.filter(state => {
      return state.x >= x1 && state.y >= y1 && (state.x + state.width) <= x2 && (state.y + state.height) <= y2
    })
    
    this.store.activeNode && this.store.activeNode.setActive(false)
    this.store.activeNode = null
    this.store.selectedNodes = selected
    selected.forEach(state => state.setActive(true))
    this.store.remove(this.rect)
    this.done()
  }
}