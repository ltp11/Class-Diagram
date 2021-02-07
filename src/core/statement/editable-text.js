import { TEXT_COLOR, NOTE_PADDING, NOTE_KNUCKLE_WIDTH, TEXT_FONT } from '../../constants'

export default class EditableText extends sving.Group {
  constructor(options) {
    super()

    const textList = options.text.split(/[\r\n]/)
    const text = new sving.MultilineText(
      textList.map(text => {
        return { text: text }
      }),
      options
    )
    text.setAttrs({
      fill: options.fill || TEXT_COLOR,
      'alignment-baseline': 'hanging',
    })
    text.font = `${options.fontSize}px sans-serif`
    text.x = options.paddingH / 2
    text.y = options.paddingV / 2
    text.el.style.userSelect = 'none'
    this.editInput = document.createElement('textarea')
    this.editInput.setAttribute('rows', textList.length > 5 ? textList.length : 5)
    this.editInput.style.position = 'absolute'
    this.editInput.style.display = 'none'
    this.editInput.style.resize = 'none'
    this.editInput.style.fontFamily = TEXT_FONT
    document.body.appendChild(this.editInput)

    this.editInput.onkeydown = evt => {
      evt.stopPropagation()
    }

    this.editInput.addEventListener('blur', evt => {
      this.editInput.style.display = 'none'
      options.onBlur && options.onBlur(this.editInput.value)
    })

    text.on('dblclick', evt => {
      const rect = options.background.el.getBoundingClientRect(text.el)
      this.editInput.value = options.text
      this.editInput.style.width = rect.width - NOTE_PADDING + 'px'
      this.editInput.style.height = rect.height - NOTE_PADDING + 'px'
      this.editInput.style.left = rect.left + NOTE_PADDING / 2 + 'px'
      this.editInput.style.top = rect.top + NOTE_KNUCKLE_WIDTH + 'px'
      this.editInput.style.display = 'block'
      this.editInput.style.border = 'none'
      this.editInput.focus()
      evt.stopPropagation()
    })
    this.add(text)

    text.cursor = 'pointer'

    this.text = text
  }
}
