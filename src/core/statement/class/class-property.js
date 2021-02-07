import BaseGroup from '../base-group'

import {
  TEXT_COLOR,
  TEXT_FONT,
  PROPERTY_HEIGHT,
  PROPERTY_PADDING,
  BORDER_COLOR,
  BORDER_WIDTH_THIN,
  MODIFIER,
  CLASS_PROPERTY_HEIGHT,
} from '../../../constants'

export default class ClassProperty extends BaseGroup {
  constructor({ x, y, width, height, propertyList = [], isNeedEvent, fontSize = 12 }) {
    super({ x, y, width, height, isNeedEvent })

    this.propertyList = propertyList
    this.fontSize = fontSize
    this.nodeList = []

    this.initBorder()
    this.initProperty()
  }

  initBorder() {
    this.border = new sving.Rect(this.width, BORDER_WIDTH_THIN)

    this.border.x = 0
    this.border.y = 0
    this.border.setAttrs({
      fill: BORDER_COLOR,
    })

    this.add(this.border)
  }

  initProperty() {
    this.propertyList.forEach((property, index) => {
      const propertyText = `${MODIFIER[property.modifier] || MODIFIER.default} ${property.name}: ${property.type}`
      const propertyNode = new sving.Text(propertyText, `${this.fontSize}px sans-serif`)

      propertyNode.el.style.userSelect = 'none'
      propertyNode.setAttrs({
        fill: TEXT_COLOR,
      })
      propertyNode.onAddedToStage(() => {
        this.setTextCenter(propertyNode, index)
      })

      const realHeight = PROPERTY_HEIGHT * this.propertyList.length + PROPERTY_PADDING * 2
      this.height = realHeight > CLASS_PROPERTY_HEIGHT ? realHeight : CLASS_PROPERTY_HEIGHT
      this.add(propertyNode)
      this.nodeList.push(propertyNode)
    })
  }

  setTextCenter(propertyNode, index) {
    const { x, y } = propertyNode.getBBox()

    propertyNode.x = Math.abs(x) + PROPERTY_PADDING
    propertyNode.y = Math.abs(y) + BORDER_WIDTH_THIN + (PROPERTY_HEIGHT - this.fontSize)/2 + PROPERTY_HEIGHT * index
  }

  updateSize({ width, height }) {
    this.border.setAttrs({
      width,
    })
  }

  updateData(propertyList, fontSize) {
    this.propertyList = propertyList
    this.clear()
    this.fontSize = fontSize
    this.initBorder()
    this.initProperty()
  }

  adjustText() {
    this.nodeList.forEach((node, index) => {
      this.setTextCenter(node, index)
    })
  }
}
