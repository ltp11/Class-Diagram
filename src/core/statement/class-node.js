import _ from 'lodash'

import { removeSVG } from '../util'

import events from '../events'

import {
  BORDER_COLOR,
  BORDER_ACTIVE_COLOR,
  BORDER_WIDTH,
  BORDER_DASHED,
  BORDER_SOLID,
  BACKGROUND_COLOR,
  ADJUST_POINT_INDEX,
  CLASS_NAME_HEIGHT,
  CLASS_PROPERTY_HEIGHT,
  CLASS_WIDTH_MIN,
  CLASS_HEIGHT_MIN,
  WORK_STATE,
} from '../../constants'

import BaseGroup from './base-group'
import ClassName from './class/class-name'
import ClassProperty from './class/class-property'
import ClassOperation from './class/class-operation'
import AdjustStatementSize from '../actions/adjust-statement-size'

export default class ClassNode extends BaseGroup {
  constructor({
    x,
    y,
    width,
    height,
    store,
    id,
    name = '',
    fontSize = 12,
    backgroundColor = BACKGROUND_COLOR,
    propertyList = [],
    operationList = [],
  }) {
    super({ x, y, width, height, id, store })

    this.sizePointList = []
    this.nodeName = 'class'
    this.isActive = false
    this.backgroundColor = backgroundColor
    this.name = name
    this.fontSize = fontSize || 12
    this.propertyList = propertyList
    this.operationList = operationList

    this.dataModel = {
      name,
      fontSize,
      backgroundColor,
      propertyList,
      operationList,
    }

    this.initBackground()
    this.initClassName()
    this.initClassProperty()
    this.initClassOperation()
    this.initClick()
    this.initSizePoints()
    this.initToolBoard()
    this.setMode(this.store.diagramMode)
  }

  initBackground() {
    this.background = new sving.Rect(this.width, this.height)

    this.background.setAttrs({
      fill: this.backgroundColor || BACKGROUND_COLOR,
      stroke: BORDER_COLOR,
      'stroke-width': BORDER_WIDTH,
      'stroke-dasharray': BORDER_SOLID,
    })

    this.add(this.background)
  }

  initClassName() {
    this.className = new ClassName({
      x: 0,
      y: 0,
      width: this.width,
      text: this.name,
      fontSize: this.fontSize,
      isNeedEvent: false,
      parent: this,
    })

    this.add(this.className)
  }

  initClassProperty() {
    this.classProperty = new ClassProperty({
      x: 0,
      y: CLASS_NAME_HEIGHT,
      width: this.width,
      height: CLASS_PROPERTY_HEIGHT,
      isNeedEvent: false,
      fontSize: this.fontSize,
      propertyList: this.propertyList.filter(property => property.name !== '' && property.type !== '' && property.modifier !== ''),
    })

    this.add(this.classProperty)
  }

  initClassOperation() {
    this.classOperation = new ClassOperation({
      x: 0,
      y: CLASS_NAME_HEIGHT + this.classProperty.height,
      width: this.width,
      height: CLASS_PROPERTY_HEIGHT,
      isNeedEvent: false,
      fontSize: this.fontSize,
      operationList: this.operationList.filter(operation => operation.name !== '' && operation.type !== '' && operation.modifier !== ''),
    })

    this.add(this.classOperation)
  }

  initClick() {
    this.on('click', e => {
      e.stopPropagation()

      if (this.store.workState === WORK_STATE.PAN_MULTI_STATEMENT || this.store.workState === WORK_STATE.AFTER_PAN_MULTI_STATEMENT) return
      console.log('触发node click')
      this.store.setActiveNode(this)
    })

    this.on('dblclick', e => {
      e.stopPropagation()
      events.$emit('xClass:editClass', this.dataModel, this)
      this.store.setActiveNode(this)
    })
  }

  setActive(isActive) {
    this.isActive = isActive
    this.background.setAttrs({
      stroke: isActive ? BORDER_ACTIVE_COLOR : BORDER_COLOR,
      'stroke-dasharray': isActive ? BORDER_DASHED : BORDER_SOLID,
    })

    isActive ? this.add(this.controlPointsGroup) : removeSVG(this.controlPointsGroup)
    isActive ? this.stateBoard.show() : this.stateBoard.hide()
  }

  /**
   * 调整大小
   * @param {*} width 宽度
   * @param {*} height 高度
   * @param {*} originPoint 调整原点
   * @param {*} originIndex 调整原点index
   */
  adjustSize(width, height, originPoint, originIndex) {
    // 更新起点坐标
    switch (originIndex) {
      case ADJUST_POINT_INDEX.RIGHT_TOP:
        this.x = originPoint.x - width
        break
      case ADJUST_POINT_INDEX.RIGHT_BOTTOM:
        this.x = originPoint.x - width
        this.y = originPoint.y - height
        break
      case ADJUST_POINT_INDEX.LEFT_BOTTOM:
        this.y = originPoint.y - height
        break
      default:
        break
    }

    const minWidth = this.getMinWidth()
    if (width < minWidth) {
      width = minWidth > CLASS_WIDTH_MIN ? minWidth : CLASS_WIDTH_MIN
    }

    const minHeight = this.getMinHeight()
    if (height < minHeight) {
      height = minHeight > CLASS_HEIGHT_MIN ? minHeight : CLASS_HEIGHT_MIN
    }

    this.updateSize({ width, height })
    this.updatePoints({ width, height })
  }

  // 更新宽高
  updateSize({ width, height }) {
    this.width = width
    this.height = height
    this.background.setAttrs({ width, height })
    this.className.updateSize({ width, height })
    this.classProperty.updateSize({ width, height })
    this.classOperation.updateSize({ width, height })
    this.stateBoard.x = width
  }

  exportData() {
    return {
      id: this.id,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
      nodeName: this.nodeName,
      name: this.name,
      fontSize: this.fontSize,
      backgroundColor: this.backgroundColor,
      propertyList: [...this.propertyList],
      operationList: [...this.operationList],
    }
  }

  // 更新数据
  updateData(dataModel) {
    const adjustAction = new AdjustStatementSize({
      store: this.store,
      statement: this,
      originPoint: { x: this.x, y: this.y },
      originPointIndex: ADJUST_POINT_INDEX.LEFT_TOP,
      done: () => {},
    })
    adjustAction.setMouseDown({ x: this.x + this.width, y: this.y + this.height })

    this.dataModel = _.cloneDeep(dataModel)
    const { name, backgroundColor, propertyList = [], operationList = [], fontSize } = this.dataModel

    this.name = name
    this.backgroundColor = backgroundColor
    this.propertyList = propertyList
    this.operationList = operationList
    this.fontSize = fontSize

    this.className.updateText(name, fontSize)
    this.background.setAttrs({
      fill: this.backgroundColor,
    })
    this.classProperty.updateData(
      propertyList
        .map(property => {
          if (property.name !== '') {
            if (property.type === '') {
              property.type = 'int'
            }
            if (property.modifier === '') {
              property.modifier = 'private'
            }
            return property
          }
          return false
        })
        .filter(Boolean),
      fontSize
    )
    this.classOperation.updateData(
      operationList
        .map(operation => {
          if (operation.name !== '') {
            if (operation.type === '') {
              operation.type = 'int'
            }
            if (operation.modifier === '') {
              operation.modifier = 'private'
            }
            return operation
          }
          return false
        })
        .filter(Boolean),
      this.classProperty.height,
      fontSize
    )

    const minWidth = this.getMinWidth()
    if (this.width < minWidth) {
      this.width = minWidth > CLASS_WIDTH_MIN ? minWidth : CLASS_WIDTH_MIN
    }

    const minHeight = this.getMinHeight()
    if (this.height < minHeight) {
      this.height = minHeight > CLASS_HEIGHT_MIN ? minHeight : CLASS_HEIGHT_MIN
    }

    adjustAction.setMouseMove({ x: this.x + this.width, y: this.y + this.height })
  }

  getMinWidth() {
    const textWidthList = []

    this.className.children.forEach(child => {
      if (child.nodeName === 'text') {
        textWidthList.push(child.getBBox().width)
      }
    })

    this.classProperty.children.forEach(child => {
      if (child.nodeName === 'text') {
        textWidthList.push(child.getBBox().width)
      }
    })

    this.classOperation.children.forEach(child => {
      if (child.nodeName === 'text') {
        textWidthList.push(child.getBBox().width)
      }
    })

    return Math.max(...textWidthList) + 10
  }

  getMinHeight() {
    return CLASS_NAME_HEIGHT + this.classProperty.height + this.classOperation.height
  }

  setMode(diagramMode) {
    switch (diagramMode) {
      case 'class':
        this.add(this.classProperty)
        this.add(this.classOperation)
        this.updateData(this.dataModel)
        break
      case 'domain':
        removeSVG(this.classProperty)
        removeSVG(this.classOperation)
        break
    }
  }
}
