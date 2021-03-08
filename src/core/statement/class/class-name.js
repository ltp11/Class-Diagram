import events from '../../events'

import { TEXT_COLOR, CLASS_NAME_HEIGHT, TEXT_FONT, KEYCODE } from '../../../constants'

import BaseGroup from '../base-group'

export default class ClassName extends BaseGroup {
  constructor({ x, y, width, height = CLASS_NAME_HEIGHT, text, isNeedEvent, fontSize = 12, parent }) {
    super({ x, y, width, height, isNeedEvent })

    this.text = text
    this.fontSize = fontSize
    this.parent = parent

    this.initBackground()
    this.initClassName()
    this.initInput()
    this.initEvent()
  }

  initBackground() {
    this.background = new sving.Rect(this.width, this.height)

    this.background.setAttrs({
      fill: 'rgba(0, 0, 0, 0)',
    })

    this.add(this.background)
  }

  initClassName() {
    this.nameSVG = new sving.Text(this.text, `${this.fontSize}px sans-serif`)

    this.nameSVG.el.style.userSelect = 'none'
    this.nameSVG.setAttrs({
      fill: TEXT_COLOR,
    })
    this.nameSVG.onAddedToStage(() => {
      this.setTextCenter()
    })

    this.add(this.nameSVG)
  }

  initInput() {
    this.editInput = document.createElement('input')
    this.editInput.style.position = 'absolute'
    this.editInput.style.display = 'none'
    this.editInput.style.resize = 'none'
    this.editInput.style.fontFamily = TEXT_FONT
    document.body.appendChild(this.editInput)

    this.editInput.onkeydown = e => {
      e.stopPropagation()
      if (e.keyCode === KEYCODE.ENTER) {
        this.editInput.blur()
      }
    }

    this.editInput.addEventListener('blur', e => {
      const { dataModel } = this.parent
      dataModel.name = this.editInput.value

      this.editInput.style.display = 'none'
      this.parent.updateData(dataModel)

      events.$emit('xClass:autoSave', 'editClassName')
    })
  }

  initEvent() {
    this.on('dblclick', e => {
      e.stopPropagation()
      const rect = this.background.el.getBoundingClientRect()
      this.editInput.value = this.text
      this.editInput.style.width = rect.width + 'px'
      this.editInput.style.height = rect.height + 'px'
      this.editInput.style.left = rect.left + 'px'
      this.editInput.style.top = rect.top + 'px'
      this.editInput.style.display = 'block'
      this.editInput.style.border = 'none'
      this.editInput.focus()
    })
  }

  updateSize({ width, height }) {
    this.width = width
    this.background.setAttrs({
      width,
    })

    this.setTextCenter()
  }

  updateText(text, fontSize) {
    this.text = text
    this.fontSize = fontSize
    this.nameSVG.textContent = text
    this.nameSVG.font = `${fontSize}px sans-serif`
    this.setTextCenter()
  }

  setTextCenter() {
    const { width, height, x, y } = this.nameSVG.getBBox()

    this.nameSVG.x = Math.abs(x) + this.width / 2 - width / 2
    this.nameSVG.y = Math.abs(y) + CLASS_NAME_HEIGHT / 2 - height / 2
  }
}
