import _ from 'lodash'
import events from '../events'
import { removeSVG } from '../util'

import BaseGroup from './base-group'
import EditableText from './editable-text'
import AdjustStatementSize from '../actions/adjust-statement-size'

import {
  BORDER_COLOR,
  BORDER_ACTIVE_COLOR,
  BORDER_WIDTH,
  BORDER_DASHED,
  BORDER_SOLID,
  BACKGROUND_COLOR,
  ADJUST_POINT_INDEX,
  NOTE_WIDTH_MIN,
  NOTE_HEIGHT_MIN,
  NOTE_KNUCKLE_WIDTH,
  NOTE_PADDING,
  TEXT_HEIGHT,
  WORK_STATE,
} from '../../constants'

export default class NoteNode extends BaseGroup {
  constructor({ x, y, width, height, store, id, backgroundColor = BACKGROUND_COLOR, text = '', fontSize = 12 }) {
    super({ x, y, width, height, id, store })

    this.sizePointList = []
    this.nodeName = 'note'
    this.isActive = false
    this.backgroundColor = backgroundColor
    this.text = text
    this.fontSize = fontSize

    this.dataModel = {
      backgroundColor,
      text,
    }

    this.background = new sving.Path('')
    this.knuckle = new sving.Path('')
    this.initBackground()
    this.add(this.background)
    this.add(this.knuckle)

    this.initText()
    this.initClick()
    this.initSizePoints()
    this.initToolBoard()
  }

  initBackground() {
    const { width, height } = this

    this.background.setAttrs({
      d: `M 0,0 L ${width - NOTE_KNUCKLE_WIDTH},0 L ${width},${NOTE_KNUCKLE_WIDTH} L ${width},${height} L 0,${height} L 0,0 Z`,
      fill: this.backgroundColor || BACKGROUND_COLOR,
      stroke: this.isActive ? BORDER_ACTIVE_COLOR : BORDER_COLOR,
      'stroke-width': BORDER_WIDTH,
      'stroke-dasharray': this.isActive ? BORDER_DASHED : BORDER_SOLID,
    })

    this.knuckle.setAttrs({
      d: `M ${width - NOTE_KNUCKLE_WIDTH},0 L ${width - NOTE_KNUCKLE_WIDTH},${NOTE_KNUCKLE_WIDTH} L ${width},${NOTE_KNUCKLE_WIDTH}`,
    })
  }

  initText() {
    if (this.noteText) {
      removeSVG(this.noteText)
    }
    this.noteText = new EditableText({
      text: this.text,
      paddingH: NOTE_PADDING,
      paddingV: NOTE_PADDING * 2 + NOTE_KNUCKLE_WIDTH * 2,
      lineHeight: TEXT_HEIGHT,
      background: this.background,
      textAnchor: 'start',
      onBlur: value => {
        this.text = value
        this.dataModel.text = value
        this.updateData(this.dataModel)
        events.$emit('xClass:autoSave', 'editNoteText')
      },
    })
    this.add(this.noteText)
  }

  initClick() {
    this.on('click', e => {
      if (this.store.workState === WORK_STATE.PAN_MULTI_STATEMENT) return
      this.store.setActiveNode(this)
    })

    this.on('dblclick', e => {
      events.$emit('xClass:editNote', this.dataModel, this)
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
    if (width < NOTE_WIDTH_MIN || width < minWidth) {
      width = minWidth > NOTE_WIDTH_MIN ? minWidth : NOTE_WIDTH_MIN
    }

    const minHeight = this.getMinHeight()
    if (height < NOTE_HEIGHT_MIN || height < minHeight) {
      height = minHeight > NOTE_HEIGHT_MIN ? minHeight : NOTE_HEIGHT_MIN
    }

    this.updateSize({ width, height })
    this.updatePoints({ width, height })
  }

  // 更新宽高
  updateSize({ width, height }) {
    this.width = width
    this.height = height
    this.initBackground()
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
      backgroundColor: this.backgroundColor,
      text: this.text,
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
    const { backgroundColor, text = '', fontSize } = this.dataModel

    this.backgroundColor = backgroundColor
    this.text = text
    this.fontSize = fontSize

    this.initText()

    const minWidth = this.getMinWidth()
    if (this.width < minWidth || this.width < NOTE_WIDTH_MIN) {
      this.width = minWidth > NOTE_WIDTH_MIN ? minWidth : NOTE_WIDTH_MIN
    }

    const minHeight = this.getMinHeight()
    if (this.height < minHeight || this.height < NOTE_HEIGHT_MIN) {
      this.height = minHeight > NOTE_HEIGHT_MIN ? minHeight : NOTE_HEIGHT_MIN
    }

    adjustAction.setMouseMove({ x: this.x + this.width, y: this.y + this.height })
  }

  getMinWidth() {
    const textWidthList = []

    this.noteText.children.forEach(child => {
      if (child.nodeName === 'text') {
        textWidthList.push(child.getBBox().width)
      }
    })

    return Math.max(...textWidthList) + NOTE_PADDING
  }

  getMinHeight() {
    const textHeightList = []

    this.noteText.children.forEach(child => {
      if (child.nodeName === 'text') {
        textHeightList.push(child.getBBox().height)
      }
    })

    return Math.max(...textHeightList) + NOTE_PADDING + NOTE_KNUCKLE_WIDTH
  }
}
