import BaseGroup from '../base-group'

import {
  TEXT_COLOR,
  TEXT_FONT,
  PROPERTY_HEIGHT,
  PROPERTY_PADDING,
  BORDER_COLOR,
  BORDER_WIDTH_THIN,
  MODIFIER,
  CLASS_NAME_HEIGHT,
  CLASS_PROPERTY_HEIGHT,
} from '../../../constants'

export default class ClassOperation extends BaseGroup {
  constructor({ x, y, width, height, operationList = [], isNeedEvent, fontSize }) {
    super({ x, y, width, height, isNeedEvent })

    this.operationList = operationList
    this.nodeList = []
    this.fontSize = fontSize

    this.initBorder()
    this.initOperation()
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

  initOperation() {
    this.operationList.forEach((operation, index) => {
      const operationText = `${MODIFIER[operation.modifier] || MODIFIER.default} ${operation.name}(): ${operation.type}`
      const operationNode = new sving.Text(operationText, `${this.fontSize}px sans-serif`)

      operationNode.el.style.userSelect = 'none'
      operationNode.setAttrs({
        fill: TEXT_COLOR,
      })
      operationNode.onAddedToStage(() => {
        this.setTextCenter(operationNode, index)
      })

      const realHeight = PROPERTY_HEIGHT * this.operationList.length + PROPERTY_PADDING * 2
      this.height = realHeight > CLASS_PROPERTY_HEIGHT ? realHeight : CLASS_PROPERTY_HEIGHT
      this.add(operationNode)
      this.nodeList.push(operationNode)
    })
  }

  setTextCenter(operationNode, index) {
    const { width, x, y } = operationNode.getBBox()

    operationNode.x = Math.abs(x) + PROPERTY_PADDING
    operationNode.y = Math.abs(y) + BORDER_WIDTH_THIN + (PROPERTY_HEIGHT - this.fontSize)/2 + PROPERTY_HEIGHT * index
  }

  updateSize({ width, height }) {
    this.border.setAttrs({
      width,
    })
  }

  updateData(operationList, propertyHeight, fontSize) {
    this.operationList = operationList
    this.y = propertyHeight + CLASS_NAME_HEIGHT
    this.clear()
    this.fontSize = fontSize
    this.initBorder()
    this.initOperation()
  }

  adjustText() {
    this.nodeList.forEach((node, index) => {
      this.setTextCenter(node, index)
    })
  }
}
