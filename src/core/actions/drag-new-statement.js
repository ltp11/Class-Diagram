import events from '../events'
import ClassNode from '../statement/class-node'
import NoteNode from '../statement/note-node'
import BaseAction from './base-action'


import { CLASS_WIDTH_MIN, CLASS_HEIGHT_MIN, NOTE_WIDTH_MIN, NOTE_HEIGHT_MIN } from '../../constants'

//误操作误差范围 拖动距离小于15px，则视为误操作
const limit = 15

export default class DragNewStatement extends BaseAction{
  constructor({ store, done }) {
    super({ store })
    this.store = store
    this.startPoint = null
    this.actionName = '拖拽新的类节点'
    this.before()
    this.done = done
  }

  setMouseDown(point, type) {
    let statement
    const options = {
      x: point.x,
      y: point.y,
      store: this.store,
    }

    if (type === 'class') {
      options.width = CLASS_WIDTH_MIN
      options.height = CLASS_HEIGHT_MIN
      statement = new ClassNode(options)
    }

    if (type === 'note') {
      options.text = '注释'
      options.width = NOTE_WIDTH_MIN
      options.height = NOTE_HEIGHT_MIN
      statement = new NoteNode(options)
    }

    this.statement = statement
    this.startPoint = point
    this.store.add(this.statement)

    events.$emit('xClass:autoSave')
  }

  setMouseMove(point) {
    this.statement.x = point.x
    this.statement.y = point.y
  }

  setMouseUp(point) {
    const distance = point.distance(this.startPoint)
    if (distance < limit) {
      this.destory()
      return false
    }
    const statementDataModel = this.statement.exportData()
    this.destory(statementDataModel)
  }

  /**
   * 销毁
   */
  destory(statementDataModel) {
    if (this.statement) {
      this.store.remove(this.statement)
      this.statement = null
    }
    this.done(statementDataModel)
    this.after()
  }
}
