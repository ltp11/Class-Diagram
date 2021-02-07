import Vec2 from 'vec2'
import events from '../events'
import BaseAction from './base-action'

import { cutLine, getSelfPointLocation } from '../util/'

export default class DragTransitionEndpoints extends BaseAction {
  constructor({ store, transition, statement, dragPoint, done, updatePointFunc, endpointType }) {
    super({ store })
    this.store = store
    this.transition = transition
    this.updatePointFunc = updatePointFunc
    this.statement = statement
    this.dragPoint = dragPoint
    this.endpointType = endpointType
    this.originNodeName = statement.nodeName

    this.startPoint = null
    this.startSide = null
    this.nowPoint = null

    this.done = done || function() {}
    this.before()
  }

  setMouseDown(point) {
    this.startPoint = new Vec2(point.x, point.y)
    this.nowPoint = new Vec2(point.x, point.y)

    const { ca, cb } = this.transition

    this.originCA = new Vec2(ca.x, ca.y)
    this.originCB = new Vec2(cb.x, cb.y)
  }

  setMouseMove(point) {
    const { statementList } = this.store
    const statement = statementList.find(statement => statement.isPointIn(point))
    if (!statement) {
      this.statement.setActive(false)
    }
    if (statement && statement.id !== this.statement) {
      this.statement.setActive(false)
      statement.setActive(true)
      this.statement = statement
    }
    this.transition[this.updatePointFunc](point)
  }

  setMouseUp(point) {
    const isIn = this.statement.isPointIn(point)
    if (isIn && this.statement.nodeName === this.originNodeName) {
      let throughLine
      if (this.endpointType === 'from') {
        this.transition.fromState = this.statement
        this.transition.fromStateId = this.statement.id
        this.transition.dataModel.fromState = this.statement
        throughLine = [point, this.transition.to]
      }
      if (this.endpointType === 'to') {
        this.transition.toState = this.statement
        this.transition.toStateId = this.statement.id
        this.transition.dataModel.toState = this.statement
        throughLine = [this.transition.from, point]
      }

      if (this.transition.fromStateId === this.transition.toStateId) {
        const { from, to } = getSelfPointLocation(this.transition.fromState, point)

        this.transition.updateFromPoint(from)
        this.transition.updateToPoint(to)
      } else {
        const { from, to } = cutLine(this.transition, throughLine, this.endpointType)

        this.transition.updateFromPoint(from)
        this.transition.updateToPoint(to)
      }
      events.$emit('xClass:autoSave')
    } else {
      this.transition[this.updatePointFunc](this.startPoint)
      this.transition.updateCa(this.originCA)
      this.transition.updateCb(this.originCB)
      this.transition.setTextCenter()
    }
    this.dragPoint.cursor = 'crosshair'
    this.done()
    this.after()
  }
}
