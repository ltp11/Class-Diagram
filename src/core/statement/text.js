import { removeSVG } from '../util'

export default class StateText extends sving.Group {
  constructor({ text, bgColor = '#ffffff', tip = false }) {
    super()

    this.bgColor = bgColor
    this.text = text
    this.active = false
    this.mainSVG = new sving.Text(this.text, '12px sans-serif')
    this.mainSVG.x = 0
    this.mainSVG.y = 0

    this.mainSVG.el.style.userSelect = 'none'

    this.mainSVG.onAddedToStage(() => {
      const bbox = this.getBBox()
      const { width, height, x, y } = bbox
      this.resetWrap(width, height, x, y)
    })
    this.add(this.mainSVG)

    if (tip) {
      this.tipsImg = new sving.Img(
        'data:image/png;base64,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'
      )
      this.tipsImg.setAttrs({
        width: 15,
        height: 15,
      })
      this.tipsImg.opacity = 1
      this.add(this.tipsImg)
    }

    this.initEvents()
  }

  setPos(x, y) {
    const { width, height } = this.getBBox()
    this.x = x - width / 2
    this.y = y - height / 2

    if (this.tipsImg) {
      this.tipsImg.x = width + 2
      this.tipsImg.y = -11
    }
  }

  getBBox() {
    return this.mainSVG.getBBox()
  }

  resetWrap(width, height, x, y) {
    const padding = 10
    const tipWidthPadding = this.tipsImg && this.tipsImg.opacity ? 15 : 0

    if (this.wrapSVG) {
      removeSVG(this.wrapSVG)
    }
    this.wrapSVG = new sving.Rect(width + padding + tipWidthPadding, height + padding)
    this.setActive(this.active)
    this.wrapSVG.x = x - padding / 2
    this.wrapSVG.y = y - padding / 2
    this.add(this.wrapSVG)
    this.el.insertBefore(this.wrapSVG.el, this.el.firstChild)
  }

  updateText(text) {
    this.mainSVG.textContent = text
    const bbox = this.getBBox()
    const { width, height, x, y } = bbox
    this.resetWrap(width, height, x, y)
  }

  showTips(show) {
    this.tipsImg.opacity = show ? 1 : 0
  }

  setColor(bgColor = 'light') {
    if (bgColor === 'light') {
      this.mainSVG.setAttrs({
        fill: '#000',
        stroke: '',
      })
    } else {
      this.mainSVG.setAttrs({
        fill: '#fff',
        stroke: '#fff',
      })
    }
  }

  setActive(active) {
    if (!this.wrapSVG) return

    this.active = active

    if (active) {
      this.wrapSVG.setAttrs({
        fill: this.bgColor,
        // stroke: '#ffc09f',
        // 'stroke-dasharray': '5,5',
      })
    } else {
      this.wrapSVG.setAttrs({
        fill: this.bgColor,
        stroke: this.bgColor,
      })
    }
  }

  initEvents() {
    // this.onDrag((x, y) => {
    //   const { parent } = this
    //   if (parent.constructor === Transition) {
    //     this.parent.textSVG.x += x
    //     this.parent.textSVG.y += y
    //   }
    // })
  }
}
