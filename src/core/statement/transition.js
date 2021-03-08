import Vec2 from 'vec2'
import {
  getId,
  getSideFromStateByPoint,
  getValue,
  getArrowRotation,
  getSelfCtrlPoint,
  getLinePointPosition,
  getSelfArrowRotation,
  removeSVG,
} from '../util'

import { WORK_STATE, MOUSE, LINE_COLOR, TEXT_COLOR, BACKGROUND_COLOR } from '../../constants'

import events from '../events'

import SvingArrow from '../../../sving-arrow/index'
import StateText from './text'
import DragTransitionEndpoints from '../actions/drag-transition-endpoints'

export default class Transition extends sving.Group {
  constructor({
    store,
    id = getId('transition'),
    from,
    to,
    ca,
    cb,
    fromStateId,
    toStateId,
    fromState = null,
    toState = null,
    status = 'formal',
    color = LINE_COLOR,
    relation = 'Association',
    stereotype = [],
    sourceMultiplicity = '',
    targetMultiplicity = '',
    sourceRoleName = '',
    targetRoleName = '',
    remark = '',
  }) {
    super()

    this.store = store
    this.id = id

    this.nodeName = 'relation'
    this.relation = relation
    this.remark = remark
    this.stereotype = stereotype
    this.sourceMultiplicity = sourceMultiplicity
    this.targetMultiplicity = targetMultiplicity
    this.sourceRoleName = sourceRoleName
    this.targetRoleName = targetRoleName

    this.fromStateId = fromStateId
    this.fromState = fromState
    this.toStateId = toStateId
    this.toState = toState
    this.color = color

    this.isActive = false

    // 正式 formal 引导线 guide
    this.status = status
    this.moveStartPoint = null

    this.mainSVG = new SvingArrow({
      from,
      to,
      moveable: false,
      isNeedCtrlPoint: false,
      onPointsDrag: () => {
        this.setTextCenter()
      },
    })

    this.isDrag = false
    this.initClick()
    this.setEndArrow()

    this.updateColor(this.color)

    if (this.status === 'guide') {
      this.mainSVG.setAttrs({
        'stroke-dasharray': '5,5',
        stroke: LINE_COLOR,
      })
    } else {
      this.initDrag()
    }

    if (ca && cb) {
      this.updateCa(ca)
      this.updateCb(cb)
    } else {
      this.initControlPoints()
    }

    this.initText()
    this.initMultiplicity()
    this.initRoleName()

    this.add(this.mainSVG)

    this.initEvents()

    this.dataModel = {
      relation,
      remark,
      fromState,
      toState,
      stereotype,
      sourceMultiplicity,
      targetMultiplicity,
      sourceRoleName,
      targetRoleName,
    }
  }

  get to() {
    return this.mainSVG.to
  }

  get from() {
    return this.mainSVG.from
  }

  get ca() {
    return this.mainSVG.ca
  }

  get cb() {
    return this.mainSVG.cb
  }

  initClick() {
    this.on('mousedown', e => {
      e.stopPropagation()
      this.isDrag = true
      events.$emit('xClass:cancelAddNew')
    })
    this.on('mouseup', e => {
      this.isDrag = false
    })
  }

  initDrag() {
    this.mainSVG.eventCurvePath.cursor = 'move'
    this.mainSVG.eventCurvePath.onDrag((dx, dy) => {
      if (this.isDrag) {
        const { from, to } = getLinePointPosition(this, dx, dy)

        this.updateFromPoint(from)
        this.updateToPoint(to)

        events.$emit('xClass:autoSave', 'moveTransition')
      }
    })
  }

  updateColor(color) {
    this.color = color
    const path = this.mainSVG.curvePath
    path.setAttrs({
      stroke: color,
    })
  }

  /**
   * 初始化贝塞尔控制点坐标
   */
  initControlPoints() {
    if (this.fromStateId === this.toStateId && this.status !== 'guide') {
      const { ca = this.ca, cb = this.cb } = getSelfCtrlPoint(this.from, this.to, this.fromState)

      this.updateCa(ca)
      this.updateCb(cb)
    } else {
      const dx = this.to.x - this.from.x
      const dy = this.to.y - this.from.y

      const ca = {
        x: this.from.x + dx / 3,
        y: this.from.y + dy / 3,
      }
      const cb = {
        x: this.from.x + (dx / 3) * 2,
        y: this.from.y + (dy / 3) * 2,
      }

      this.updateCa(ca)
      this.updateCb(cb)
    }
  }

  initMultiplicity() {
    this.sourceMultiplicitySVG = new StateText({ text: this.sourceMultiplicity, bgColor: 'none' })

    this.sourceMultiplicity !== '' && this.add(this.sourceMultiplicitySVG)
    this.sourceMultiplicitySVG.onAddedToStage(() => {
      this.setMultiplicityPos(this.from, this.fromState, this.sourceMultiplicitySVG)
    })

    this.targetMultiplicitySVG = new StateText({ text: this.targetMultiplicity, bgColor: 'none' })

    this.targetMultiplicity !== '' && this.add(this.targetMultiplicitySVG)
    this.targetMultiplicitySVG.onAddedToStage(() => {
      this.setMultiplicityPos(this.to, this.toState, this.targetMultiplicitySVG)
    })
  }

  setMultiplicityPos(point, statement, SVG) {
    if (this.status === 'guide' || statement === null) {
      removeSVG(SVG)
      return
    }
    const { x, y } = point

    const { side } = getSideFromStateByPoint(point, statement)

    switch (side) {
      case 'right':
        SVG.x = x + 10
        SVG.y = y - 10
        break
      case 'left':
        SVG.x = x - 25
        SVG.y = y - 10
        break
      case 'top':
        SVG.x = x + 10
        SVG.y = y - 10
        break
      case 'bottom':
        SVG.x = x + 10
        SVG.y = y + 20
        break
    }
  }

  initRoleName() {
    this.sourceRoleNameSVG = new StateText({
      text: this.sourceRoleName ? '+ ' + this.sourceRoleName : '',
      bgColor: 'none',
    })

    this.sourceRoleName !== '' && this.add(this.sourceRoleNameSVG)
    this.sourceRoleNameSVG.onAddedToStage(() => {
      this.setRoleNamePos(this.from, this.fromState, this.sourceRoleNameSVG)
    })

    this.targetRoleNameSVG = new StateText({
      text: this.targetRoleName ? '+ ' + this.targetRoleName : '',
      bgColor: 'none',
    })

    this.targetRoleName !== '' && this.add(this.targetRoleNameSVG)
    this.targetRoleNameSVG.onAddedToStage(() => {
      this.setRoleNamePos(this.to, this.toState, this.targetRoleNameSVG)
    })
  }

  setRoleNamePos(point, statement, SVG) {
    if (this.status === 'guide') return
    const { x, y } = point
    const { width, height } = SVG.getBBox()
    const { side } = getSideFromStateByPoint(point, statement)

    switch (side) {
      case 'right':
        SVG.x = x + 10
        SVG.y = y + 20
        break
      case 'left':
        SVG.x = x - width - 10
        SVG.y = y + 20
        break
      case 'top':
        SVG.x = x - width - 10
        SVG.y = y - 10
        break
      case 'bottom':
        SVG.x = x - width - 10
        SVG.y = y + 20
        break
    }
  }

  /**
   * 初始化文字
   */
  initText() {
    const text = this.stereotype.length ? `《${this.stereotype.join(',')}》` : ''
    this.textSVG = new StateText({ text, bgColor: 'none' })
    this.textSVG.setAttrs({
      fill: TEXT_COLOR,
    })
    this.stereotype.length && this.add(this.textSVG)

    this.remarkSVG = new StateText({ text: this.remark, bgColor: 'none' })
    this.remarkSVG.setAttrs({
      fill: TEXT_COLOR,
    })
    this.remark !== '' && this.add(this.remarkSVG)

    this.textSVG.onAddedToStage(() => {
      this.setTextCenter()
    })

    this.remarkSVG.onAddedToStage(() => {
      this.setTextCenter()
    })
  }

  /**
   * 更新文字
   * @param {*} text
   */
  updateText() {
    if (!this.textSVG) return
    const text = this.stereotype.length ? `《${this.stereotype.join(',')}》` : ''

    this.textSVG.updateText(text)
    this.stereotype.length ? this.add(this.textSVG) : removeSVG(this.textSVG)

    this.remarkSVG.updateText(this.remark)
    this.remark !== '' ? this.add(this.remarkSVG) : removeSVG(this.remarkSVG)
    this.setTextCenter()
  }

  /**
   * 设置文字在中心位置
   * 在移动端点和贝塞尔控制点时调用
   */
  setTextCenter() {
    if (!this.textSVG) return
    if (this.status === 'guide') return
    const from = new Vec2(this.from.x, this.from.y)
    const to = new Vec2(this.to.x, this.to.y)
    const ca = new Vec2(this.mainSVG.ca.x, this.mainSVG.ca.y)
    const cb = new Vec2(this.mainSVG.cb.x, this.mainSVG.cb.y)

    const centerPosition = getValue(from, ca, cb, to, 0.5)

    this.remarkSVG.setPos(centerPosition.x, centerPosition.y)
    this.textSVG.setPos(centerPosition.x, centerPosition.y + 20)
  }

  /**
   * 更新from点坐标
   * @param {*} from
   */
  updateFromPoint(from) {
    if (!from) return
    this.mainSVG.updateFromPoint(from.x, from.y)
    this.handleCtrlPoints()
    if (this.status !== 'guide') {
      this.setEndArrow()
    }
  }

  /**
   * 更新to点坐标
   */
  updateToPoint(to) {
    if (!to) return
    this.mainSVG.updateToPoint(to.x, to.y)
    this.handleCtrlPoints()
    if (this.status !== 'guide') {
      this.setEndArrow()
    }
  }

  /**
   * 更新ca点坐标
   * @param {*} ca
   */
  updateCa(ca) {
    this.mainSVG.updateControlPointA(ca.x, ca.y)
  }

  /**
   * 更新cb点坐标
   * @param {*} cb
   */
  updateCb(cb) {
    this.mainSVG.updateControlPointB(cb.x, cb.y)
  }

  /**
   * 设置激活态
   * @param {*} isActive
   */
  setActive(isActive) {
    this.isActive = isActive
    const strokeColor = isActive ? '#07C160' : LINE_COLOR
    this.mainSVG.setAttr('stroke', strokeColor)
    this.textSVG && this.textSVG.setActive(isActive)
    if (isActive) {
      this.mainSVG.select()
    } else {
      this.mainSVG.unselect()
    }
  }

  /**
   * 端点移动时，同步处理贝塞尔曲线调整点ctrlA ctrlBs
   * @param {*} dx
   * @param {*} dy
   * @param {*} type 移动端点类型： to / from
   */
  handleCtrlPoints() {
    this.initControlPoints()
    this.setTextCenter()
    this.setMultiplicityPos(this.from, this.fromState, this.sourceMultiplicitySVG)
    this.setMultiplicityPos(this.to, this.toState, this.targetMultiplicitySVG)
    this.setRoleNamePos(this.from, this.fromState, this.sourceRoleNameSVG)
    this.setRoleNamePos(this.to, this.toState, this.targetRoleNameSVG)
  }

  /**
   * 初始化事件
   */
  initEvents() {
    this.on('mouseup', e => {
      if (e.which === MOUSE.RIGHT) {
        this.store.setActiveNode(this)
        // const stage = this.store.getStage()
        // const position = getContainerPointPosition(stage, e)
        // events.$emit('xsm:showCustomizeContextMenu', { position, element: this, colorList: this.store.colorList })
      }
    })
    this.on('click', e => {
      e.stopPropagation()
      this.store.setActiveNode(this)
    })
    this.on('dblclick', e => {
      e.stopPropagation()
      if (this.fromState.nodeName === 'class' && this.toState.nodeName === 'class') {
        events.$emit('xClass:editLine', this.dataModel, this)
      }
      this.store.setActiveNode(this)
    })

    // 端点drag绑定事件
    const bindEndPointDrag = endpointType => {
      const point = new Vec2(this.mainSVG[endpointType].x, this.mainSVG[endpointType].y)
      this.store.mouseEvent.setMouseMove(point)
    }

    // 端点dragEnd绑定事件
    const bindEndPointDragEnd = endpointType => {
      const point = new Vec2(this.mainSVG[endpointType].x, this.mainSVG[endpointType].y)
      this.store.mouseEvent.setMouseUp(point)
      this.store.workState = WORK_STATE.NORMAL
    }

    // 端点dragStart绑定事件
    const bindEndPointDragStart = endpointType => {
      if (this.store.workState !== WORK_STATE.NORMAL) return

      const store = this.store
      const pos = this.mainSVG[endpointType]
      let statement, dragPoint, updatePointFunc

      store.workState = WORK_STATE.DRAG_TRANSITION_ENDPOINT

      if (endpointType === 'to') {
        statement = this.toState
        dragPoint = this.mainSVG.toPoint
        updatePointFunc = 'updateToPoint'
      } else {
        statement = this.fromState
        dragPoint = this.mainSVG.fromPoint
        updatePointFunc = 'updateFromPoint'
      }
      store.mouseEvent = new DragTransitionEndpoints({
        store,
        transition: this,
        statement,
        dragPoint,
        updatePointFunc,
        endpointType,
        done: () => {
          store.workState = WORK_STATE.NORMAL
          store.mouseEvent = null
          dragPoint.offDrag(bindEndPointDrag)
          dragPoint.offDragEnd(bindEndPointDragEnd)
        },
      })
      store.mouseEvent.setMouseDown({ x: pos.x, y: pos.y })
      dragPoint.onDrag(() => {
        bindEndPointDrag(endpointType)
      })
      dragPoint.onDragEnd(() => {
        bindEndPointDragEnd(endpointType)
      })
    }

    this.mainSVG.toPoint.onDragStart(() => {
      bindEndPointDragStart('to')
    })

    this.mainSVG.fromPoint.onDragStart(() => {
      bindEndPointDragStart('from')
    })

    const bindCtrlPointDragStart = () => {
      this.store.workState = WORK_STATE.DRAG_TRANSITION_CTRLPOINT
    }

    const bindCtrlPointDragEnd = () => {
      this.store.workState = WORK_STATE.NORMAL
    }

    this.mainSVG.controlPointA.onDragStart(bindCtrlPointDragStart)
    this.mainSVG.controlPointA.onDragEnd(bindCtrlPointDragEnd)
    this.mainSVG.controlPointB.onDragStart(bindCtrlPointDragStart)
    this.mainSVG.controlPointB.onDragEnd(bindCtrlPointDragEnd)
  }

  exportData() {
    return {
      id: this.id,
      stereotype: this.stereotype,
      sourceMultiplicity: this.sourceMultiplicity,
      targetMultiplicity: this.targetMultiplicity,
      sourceRoleName: this.sourceRoleName,
      targetRoleName: this.targetRoleName,
      remark: this.remark,
      nodeName: this.nodeName,
      relation: this.relation,
      color: this.color,
      from: new Vec2(this.mainSVG.from.x, this.mainSVG.from.y),
      to: new Vec2(this.mainSVG.to.x, this.mainSVG.to.y),
      ca: new Vec2(this.mainSVG.ca.x, this.mainSVG.ca.y),
      cb: new Vec2(this.mainSVG.cb.x, this.mainSVG.cb.y),
      fromStateId: this.fromState && this.fromState.id,
      toStateId: this.toState && this.toState.id,
    }
  }

  updateDataModel(dataModel) {
    this.dataModel = { ...this.dataModel, ...dataModel }
  }

  updateData(dataModel) {
    const { stereotype, sourceMultiplicity, targetMultiplicity, sourceRoleName, targetRoleName, remark } = dataModel

    this.stereotype = stereotype
    this.remark = remark

    this.updateText(stereotype)

    // 更新多重性
    this.sourceMultiplicity = sourceMultiplicity
    this.targetMultiplicity = targetMultiplicity
    this.sourceMultiplicitySVG.updateText(this.sourceMultiplicity)
    this.targetMultiplicitySVG.updateText(this.targetMultiplicity)
    this.setMultiplicityPos(this.from, this.fromState, this.sourceMultiplicitySVG)
    this.setMultiplicityPos(this.to, this.toState, this.targetMultiplicitySVG)
    this.sourceMultiplicity !== '' ? this.add(this.sourceMultiplicitySVG) : removeSVG(this.sourceMultiplicitySVG)
    this.targetMultiplicity !== '' ? this.add(this.targetMultiplicitySVG) : removeSVG(this.targetMultiplicitySVG)

    // 更新角色名称
    this.sourceRoleName = sourceRoleName
    this.targetRoleName = targetRoleName
    this.sourceRoleNameSVG.updateText(this.sourceRoleName ? '+ ' + this.sourceRoleName : '')
    this.targetRoleNameSVG.updateText(this.targetRoleName ? '+ ' + this.targetRoleName : '')
    this.setRoleNamePos(this.from, this.fromState, this.sourceRoleNameSVG)
    this.setRoleNamePos(this.to, this.toState, this.targetRoleNameSVG)
    this.sourceRoleName !== '' ? this.add(this.sourceRoleNameSVG) : removeSVG(this.sourceRoleNameSVG)
    this.targetRoleName !== '' ? this.add(this.targetRoleNameSVG) : removeSVG(this.targetRoleNameSVG)

    this.updateDataModel(dataModel)
    this.setEndArrow()
    events.$emit('xClass:autoSave', 'updateTransition')
  }

  setEndArrow() {
    this.mainSVG.remove(this.mainSVG.endArrow)
    if (this.status === 'guide') return

    let angle = 0
    if (this.fromStateId === this.toStateId) {
      angle = getSelfArrowRotation(this)
    } else {
      angle = getArrowRotation(this.mainSVG.from, this.mainSVG.to)
    }

    switch (this.relation) {
      case 'NoteLink':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '5,5',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0')
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Association':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '0',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0')
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Directed Association':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '0',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0 L 12,6 L 0,12')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 12
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: 'transparent',
          stroke: LINE_COLOR,
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Aggregation':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '0',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,6 L 10,12 L 20,6 L 10,0 L 0,6')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 20
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: BACKGROUND_COLOR,
          stroke: LINE_COLOR,
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Composition':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '0',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,6 L 10,12 L 20,6 L 10,0 L 0,6')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 20
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: LINE_COLOR,
          stroke: LINE_COLOR,
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Realization':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '5,5',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0 L 12,6 L 0,12 L 0,0')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 12
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: BACKGROUND_COLOR,
          stroke: LINE_COLOR,
          'stroke-dasharray': '0',
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Dependency':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '5,5',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0 L 12,6 L 0,12')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 12
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: 'transparent',
          stroke: LINE_COLOR,
          'stroke-dasharray': '0',
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
      case 'Generalization':
        this.mainSVG.setAttrs({
          'stroke-dasharray': '0',
        })
        this.mainSVG.endArrow = new sving.Path('M 0,0 L 12,6 L 0,12 L 0,0')
        this.mainSVG.endArrow.x = this.mainSVG.to.x
        this.mainSVG.endArrow.y = this.mainSVG.to.y
        this.mainSVG.endArrow.originX = 12
        this.mainSVG.endArrow.originY = 6
        this.mainSVG.endArrow.rotation = angle
        this.mainSVG.endArrow.setAttrs({
          fill: BACKGROUND_COLOR,
          stroke: LINE_COLOR,
          'stroke-dasharray': '0',
        })
        this.mainSVG.add(this.mainSVG.endArrow)
        break
    }
  }
}
