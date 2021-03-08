import events from '../events'
import Vec2 from 'vec2'
import Transition from '../statement/transition'
import { getSelfPointLocation, getSelfCtrlPoint } from '../util'
import BaseAction from './base-action'
import { CLASS_WIDTH_MIN, CLASS_HEIGHT_MIN } from '../../constants'
// 创建指向状态
const CREATE_STATUS = {
  FAIL: 0, // 失败状态：例如，初始和结束状态节点不能指向自身
  SELF: 1, // 指向自己
  OTHER_STATE: 2, // 指向另一个状态
  NEW_STATE: 3, // 指向空白处（创建个新的状态）
}

export default class DragNewTransition extends BaseAction {
  constructor({ store, fromState, toState = null, from, to = null, done }) {
    super({ store })
    this.store = store
    this.fromState = fromState
    this.toState = toState

    this.from = from
    this.to = to

    // 结束事件
    this.done = done || function() {}
    this.transition = null
    this.moveStatus = true
    this.before()
  }

  setMouseDown() {
    const pos = this.from
    this.transition = new Transition({
      from: { x: pos.x, y: pos.y },
      to: { x: pos.x, y: pos.y },
      status: 'guide',
    })
    this.store.add(this.transition)
  }

  setMouseMove(point) {
    if (!this.moveStatus) return
    this.transition.updateToPoint(point)
  }

  setMouseUp(point) {
    if (!this.moveStatus) return

    const { status, toState } = this.getCreateStatus(point)
    switch (status) {
      case CREATE_STATUS.FAIL:
        this.destory()
        break
      case CREATE_STATUS.SELF:
        this.createSelfTransition(point)
        break
      case CREATE_STATUS.OTHER_STATE:
        this.createNewTransition(point, toState)
        break
      case CREATE_STATUS.NEW_STATE:
        this.createNewStatement(point)
        break
      default:
        this.destory()
    }
  }

  /**
   * 销毁
   */
  destory(transitionDataModel) {
    if (this.transition) {
      this.store.remove(this.transition)
      this.transition = null
    }
    this.done(transitionDataModel)
    this.after()
  }

  /**
   * 创建自身指向的transition
   * @param {*} point
   */
  createSelfTransition(point) {
    this.moveStatus = false
    const afterInsert = relation => {
      if (relation) {
        const { from, to } = getSelfPointLocation(this.fromState, point)
        const { ca, cb } = getSelfCtrlPoint(from, to, this.fromState)
        const transitionDataModel = {
          from,
          to,
          ca,
          cb,
          fromStateId: this.fromState.id,
          toStateId: this.fromState.id,
          relation,
        }
        this.destory(transitionDataModel)

        events.$emit('xClass:autoSave', 'createSelfTransition')
      } else {
        this.destory()
      }
    }

    events.$emit('xClass:showRelationBoard', {
      point,
      origin: {
        x: this.store.x,
        y: this.store.y,
      },
      position: point,
      callback: afterInsert,
    })
  }

  /**
   * 创建连接另一个存在statement的transition
   * @param {*} point 鼠标落点
   * @param {*} statement 鼠标落点的statement
   */
  lineToOtherStatement(point, toState, relation) {
    const fromState = this.fromState
    const fromCenter = fromState.getCenter()
    const from = this.fromState.getIntersection(point, fromCenter)
    const to = toState.getIntersection(fromCenter, point)

    const transitionDataModel = {
      from,
      to,
      fromStateId: fromState.id,
      toStateId: toState.id,
      relation,
    }

    this.destory(transitionDataModel)
  }

  createNewTransition(point) {
    this.moveStatus = false
    const { toState } = this.getCreateStatus(point)
    const isNote = this.fromState.nodeName === 'note' || toState.nodeName === 'note'

    if (isNote) {
      this.lineToOtherStatement(point, toState, 'NoteLink')
      events.$emit('xClass:autoSave', 'lineToOtherNote')
      return
    }

    const afterInsert = relation => {
      if (relation) {
        this.lineToOtherStatement(point, toState, relation)

        events.$emit('xClass:autoSave', 'lineToOtherClass')
      } else {
        this.destory()
      }
    }

    events.$emit('xClass:showRelationBoard', {
      point,
      origin: {
        x: this.store.x,
        y: this.store.y,
      },
      position: point,
      callback: afterInsert,
    })
  }

  /**
   * 落在空白处，创建一个新的statement, 然后创建transition
   * @param {*} point 鼠标落点
   */
  createNewStatement(point) {
    this.moveStatus = false
    const isNote = this.fromState.nodeName === 'note'

    if (isNote) {
      this.destory()
      return
    }

    const afterInsert = (toState, relation) => {
      if (toState && relation) {
        this.lineToOtherStatement(point, toState, relation)

        events.$emit('xClass:autoSave', 'lineToNewStatement')
      } else {
        this.destory()
      }
    }

    // 根据矢量线的方向控制新statement的起始点，保证新statment某条边的中点被连
    let pos = new Vec2(point.x, point.y)
    const { x, y } = new Vec2(point.x - this.from.x, point.y - this.from.y)
    if (x > 0 && x >= Math.abs(y)) {
      pos.y = point.y - CLASS_HEIGHT_MIN / 2
    } else if (y > 0 && y >= Math.abs(x)) {
      pos.x = point.x - CLASS_WIDTH_MIN / 2
    } else if (x < 0 && Math.abs(x) >= Math.abs(y)) {
      pos.x = point.x - CLASS_WIDTH_MIN
      pos.y = point.y - CLASS_HEIGHT_MIN / 2
    } else {
      pos.x = point.x - CLASS_WIDTH_MIN / 2
      pos.y = point.y - CLASS_HEIGHT_MIN
    }

    // if (pos.x < 0 || pos.y < 0) {
    //   this.destory()
    //   return
    // }

    events.$emit('xClass:showInsertBoard', {
      point,
      origin: {
        x: this.store.x,
        y: this.store.y,
      },
      position: pos,
      callback: afterInsert,
    })
  }

  /**
   * 获取当前鼠标位置的状态
   * return CREATE_STATUS
   * @param {*} point
   */
  getCreateStatus(point) {
    let status, toState
    const fromState = this.fromState

    if (fromState.isPointIn(point)) {
      status = fromState.nodeName === 'class' ? CREATE_STATUS.SELF : CREATE_STATUS.FAIL
    } else {
      toState = this.store.statementList.find(statement => statement.isPointIn(point))
      status = toState ? CREATE_STATUS.OTHER_STATE : CREATE_STATUS.NEW_STATE
    }

    return { status, toState }
  }
}
