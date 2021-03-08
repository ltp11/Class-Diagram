import { Message } from 'element-ui'
import { cloneDeep } from 'lodash'
import { v4 as uuid } from 'uuid'
import events from './events'
import { getStagePointPosition, getPagePointPosition, getId } from './util'

import { WORK_STATE, WINDOW_MOUSEEVENTS, MOUSE, KEYCODE, TOOL_WIDTH, ELEMENT_TYPE } from '../constants'

import PanStage from './actions/pan-stage'
import DragNewStatement from './actions/drag-new-statement.js'
import DragNewTransition from './actions/drag-new-transition'
import DragMultiStateSelect from './actions/drag-multi-state-select'
import Transition from './statement/transition'
import ClassNode from './statement/class-node'
import NoteNode from './statement/note-node'
import Stack from '../algorithm/stack'

export default class ClassStore extends sving.Group {
  constructor({ stage, name, id, x, y, diagramMode, statementList, transitionList }) {
    super()
    this._stage = stage
    this.name = name
    this.id = id

    this.statementList = []
    this.transitionList = []
    this.activeNode = undefined
    this.selectedNodes = []
    this.colorList = []

    this.undoStack = new Stack(300)
    this.redoStack = new Stack(300)

    this.copyNodes = []
    this.copyNum = 0

    this.workState = WORK_STATE.NORMAL

    this.initRender({
      x,
      y,
      statementList,
      transitionList,
      diagramMode,
    })
    this.initEvents()
  }

  pushStack(action = 'update', data, stackType = 'undo', userBehavior = true) {
    console.log('pushStack, action:', action, data, '推入栈', stackType)
    if (this.readOnly) return
    const stackData = data
      ? cloneDeep(data)
      : {
          before: {},
          after: cloneDeep(this.exportData()),
        }

    const { before, after } = stackData
    // 如果前后数据一致，则不触发
    if (JSON.stringify(before) === JSON.stringify(after)) return

    if (stackType === 'undo') {
      this.undoStack.push({
        action,
        data: stackData,
      })
      if (userBehavior) {
        this.redoStack.clear()
      }
    } else {
      this.redoStack.push({
        action,
        data: stackData,
      })
    }

    events.$emit('xClass:stackchange', {
      undoStack: this.undoStack,
      redoStack: this.redoStack,
    })
  }

  clearStack() {
    this.undoStack.clear()
    this.redoStack.clear()
  }

  getUndoStack() {
    return this.undoStack
  }

  getRedoStack() {
    return this.redoStack
  }

  setCursor(cursor = 'default') {
    document.querySelector('#pan_satge_layer').style.cursor = cursor
  }

  clearStage() {
    this.statementList = []
    this.transitionList = []
    this.selectedNodes = []
    this.copyNodes = []
    this.copyNum = 0
    this.workState = WORK_STATE.NORMAL

    this.clear()
  }

  initRender({ x, y, statementList, transitionList, diagramMode }) {
    this.clearStage()
    this.x = x
    this.y = y
    this.diagramMode = diagramMode
    this.initStatementList(statementList)
    this.initTransitionList(transitionList)
  }

  initEvents() {
    this._stage.el.oncontextmenu = e => {
      this.setAllNormal()
      startPoint = getStagePointPosition(this._stage, e)

      events.$emit('xClass:showMenuBoard', {
        point: startPoint,
        origin: {
          x: store.x,
          y: store.y,
        },
        position: startPoint,
        callback: () => {},
      })
      events.$emit('xClass:hidePropertyPanel')

      return false
    }

    let startPoint = null

    this._stage.el.onmousedown = e => {
      if (e.which !== MOUSE.LEFT) return

      startPoint = getStagePointPosition(this._stage, e)
      events.$emit('xClass:cancelAddNew')
    }

    this._stage.el.onmouseup = e => {
      if (e.which !== MOUSE.LEFT) return

      const endPoint = getStagePointPosition(this._stage, e)
      if (this.workState === WORK_STATE.SHIFT_MULTI_SELECTING) return
      if (startPoint && endPoint.distance(startPoint) < 1) {
        this.setAllNormal()
      }
    }

    const stageEl = document.querySelector('#svingRoot')
    window.onmousedown = e => {
      // 如果作用的元素不包含svg根元素则不绑定事件
      if (!e.path.includes(stageEl)) return

      const point = getStagePointPosition(this._stage, e)
      if (e.which === MOUSE.LEFT && this.workState === WORK_STATE.PAN_STAGE) {
        this.mouseEvent = new PanStage({
          store: this,
          done: () => {
            this.mouseEvent = null
            this.workState = WORK_STATE.NORMAL
          },
        })

        this.mouseEvent.setMouseDown(point)
        return
      }

      // 批量框选
      if (e.which === MOUSE.LEFT && (this.workState === WORK_STATE.NORMAL || this.workState === WORK_STATE.AFTER_PAN_MULTI_STATEMENT)) {
        this.workState = WORK_STATE.FRAME_MULTI_SELECTING
        this.mouseEvent = new DragMultiStateSelect({
          store: this,
          done: () => {
            this.mouseEvent = null
            if (this.selectedNodes.length > 1) {
              this.workState = WORK_STATE.AFTER_PAN_MULTI_STATEMENT
              events.$emit('xClass:openMultiProperty', this.selectedNodes)
            } else {
              this.workState = WORK_STATE.NORMAL
            }
          },
        })
        this.mouseEvent.setMouseDown(point)
        return
      }

      if (WINDOW_MOUSEEVENTS.includes(this.workState)) {
        this.mouseEvent && this.mouseEvent.setMouseDown(point)
      }
    }

    window.onmousemove = e => {
      if (!e.path.includes(stageEl)) return
      if (e.which !== MOUSE.LEFT) return

      if (WINDOW_MOUSEEVENTS.includes(this.workState)) {
        const point = getStagePointPosition(this._stage, e)
        this.mouseEvent && this.mouseEvent.setMouseMove(point)
        return
      }
    }

    window.onmouseup = e => {
      if (e.which !== MOUSE.LEFT) return

      if (WINDOW_MOUSEEVENTS.includes(this.workState)) {
        const point = getStagePointPosition(this._stage, e)
        this.mouseEvent && this.mouseEvent.setMouseUp(point)
      }
    }

    const S_DOM = ['INPUT', 'TEXTAREA']
    const onkeyupEvent = e => {
      const keyCode = e.keyCode
      if ((keyCode === KEYCODE.DELETE || keyCode === KEYCODE.BACKSPACE) && (this.activeNode || this.selectedNodes.length)) {
        events.$emit('xClass:removeElement', this.activeNode && this.activeNode.id)
        return
      }

      if (keyCode === KEYCODE.SPACE && !S_DOM.includes(e.target.nodeName)) {
        document.querySelector('#pan_satge_layer').style.display = 'none'
        this.setCursor('default')
        if (this.workState === WORK_STATE.PAN_STAGE) {
          this.workState = WORK_STATE.NORMAL
        }
        return
      }

      if (keyCode === KEYCODE.SHIFT) {
        this.workState = WORK_STATE.NORMAL
        return false
      }
    }
    const onkeydownEvent = e => {
      const keyCode = e.keyCode
      if (keyCode === KEYCODE.SPACE && !S_DOM.includes(e.target.nodeName)) {
        document.querySelector('#pan_satge_layer').style.display = 'block'
        this.setCursor('grab')
        this.workState = WORK_STATE.PAN_STAGE
        return false
      }
      if (keyCode === KEYCODE.SHIFT) {
        this.workState = WORK_STATE.SHIFT_MULTI_SELECTING
        return false
      }

      if ((e.metaKey || e.ctrlKey) && e.keyCode === KEYCODE.C) {
        this.copyElements()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.keyCode === KEYCODE.V) {
        this.pasteElements()
        return
      }
    }

    window.onkeyup = onkeyupEvent
    window.onkeydown = onkeydownEvent

    stageEl.onfocus = () => {
      window.onkeyup = onkeyupEvent
      window.onkeydown = onkeydownEvent
    }

    stageEl.onblur = () => {
      window.onkeyup = e => {
        const keyCode = e.keyCode
        if (keyCode === KEYCODE.SPACE) {
          document.querySelector('#pan_satge_layer').style.display = 'none'
          this.setCursor('default')
          if (this.workState === WORK_STATE.PAN_STAGE) {
            this.workState = WORK_STATE.NORMAL
          }
          return
        }
      }
      window.onkeydown = e => {
        const keyCode = e.keyCode
        if (keyCode === KEYCODE.SPACE && !S_DOM.includes(e.target.nodeName)) {
          this.setCursor('grab')
          this.workState = WORK_STATE.PAN_STAGE
          return false
        }
      }
    }

    events.$on('xClass:updateActiveNode', data => {
      console.log('更新activeNode', this.activeNode, data)
      this.activeNode && this.activeNode.updateData(data)

      events.$emit('xClass:autoSave', 'updateNode')
    })

    events.$on('xClass:removeElement', (elementId = null, callback) => {
      ide.$vue
        .$confirm('删除后不可恢复，确定删除吗？', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        .then(() => {
          if (this.selectedNodes.length > 0) {
            this.selectedNodes.forEach(state => {
              this.removeElement(state.id)
            })
          } else {
            this.removeElement(elementId)
          }
          callback && callback()
          events.$emit('xClass:autoSave', 'removeNode')
        })
    })

    events.$on('xClass:setMode', diagramMode => {
      this.diagramMode = diagramMode
      this.statementList.forEach(statement => statement.setMode && statement.setMode(diagramMode))
    })
  }

  copyElements() {
    this.copyNodes = []
    this.copyNodes = this.selectedNodes.map(node => node)
    this.copyNum = 0
    this.copyNodes.length && Message.success('复制节点成功')
  }

  pasteElements() {
    this.statementList.forEach(statement => {
      statement.setActive(false)
    })
    this.transitionList.forEach(transition => transition.setActive(false))

    this.selectedNodes = []
    this.activeNode = null
    const delta = 20 * ++this.copyNum

    let copyList = []
    console.log('复制节点列表', this.copyNodes)
    if (this.copyNodes.length > 1) {
      this.copyNodes.forEach(node => {
        const statementModel = node.exportData()
        statementModel.oldId = statementModel.id
        statementModel.id = getId('statement')
        statementModel.x += delta
        statementModel.y += delta
        statementModel.renderType = 'statement'
        copyList.push(statementModel)
      })

      this.transitionList.forEach(transition => {
        const fromState = copyList.find(state => transition.fromStateId === state.oldId)
        const toState = copyList.find(state => transition.toStateId === state.oldId)
        if (fromState && toState) {
          const transitionModel = transition.exportData()
          transitionModel.id = getId('transition')
          transitionModel.from.x += delta
          transitionModel.from.y += delta
          transitionModel.to.x += delta
          transitionModel.to.y += delta
          transitionModel.ca.x += delta
          transitionModel.ca.y += delta
          transitionModel.cb.x += delta
          transitionModel.cb.y += delta

          transitionModel.fromStateId = fromState.id
          transitionModel.toStateId = toState.id
          transitionModel.renderType = 'transition'
          copyList.push(transitionModel)
        }
      })
    } else if (this.copyNodes.length === 1) {
      // 单个线条不复制
      const state = this.copyNodes[0]
      if (state.constructor !== Transition) {
        const statementModel = state.exportData()
        delete statementModel.id
        statementModel.x += delta
        statementModel.y += delta
        statementModel.renderType = 'statement'
        copyList.push(statementModel)
      }
    }

    console.log('copyList', copyList)

    copyList.forEach(elementModel => {
      if (elementModel.renderType === 'statement') {
        const { propertyList = [], operationList = [] } = elementModel
        propertyList.forEach((prop, i) => {
          elementModel.propertyList[i] = {
            ...prop,
            key: uuid(),
          }
        })
        operationList.forEach((method, i) => {
          elementModel.operationList[i] = {
            ...method,
            key: uuid(),
          }
        })
        const statement = this.addNewStatement(elementModel, elementModel.nodeName)
        statement.setActive(true)
        this.selectedNodes.push(statement)
        this.activeNode = statement
      } else {
        this.addNewTransition(elementModel)
      }
    })
  }

  getStage() {
    return this._stage
  }

  clearStage() {
    this.clear()
    this.statementList = []
    this.transitionList = []
    this.x = 0
    this.y = 0
  }

  setActiveNode(node) {
    if (this.workState === WORK_STATE.SHIFT_MULTI_SELECTING) {
      if (node.isActive) {
        const index = this.selectedNodes.findIndex(state => state.id === node.id)
        if (index > -1) {
          this.selectedNodes.splice(index, 1)
          if (this.selectedNodes.length < 1) {
            events.$emit('xClass:closeMultiProperty')
          }
        }
        node.setActive(false)
      } else {
        node.setActive(true)
        this.selectedNodes.push(node)
        if (this.selectedNodes.length > 1) {
          events.$emit('xClass:openMultiProperty', this.selectedNodes)
        }
      }
    } else {
      this.setAllNormal()
      this.selectedNodes = []
      this.selectedNodes.push(node)
      node.setActive(true)
    }
    this.activeNode = node
  }

  setActiveNodeByUUID(uuid) {
    const node = this.statementList.find(item => item.id === uuid)

    node && this.setActiveNode(node)
  }

  dragNewStatement(e, type) {
    if (e.which !== MOUSE.LEFT) return
    if (this.workState === WORK_STATE.NORMAL) {
      const point = getStagePointPosition(this._stage, getPagePointPosition(e))
      this.mouseEvent = new DragNewStatement({
        store: this,
        done: statementDataModel => {
          this.mouseEvent = null
          this.workState = WORK_STATE.NORMAL
          if (statementDataModel) {
            this.addNewStatement(statementDataModel, type)
          }
        },
      })
      this.mouseEvent.setMouseDown(point, type)
      this.workState = WORK_STATE.DRAG_NEW_STATEMENT
    }
  }

  addNewStatement(statementDataModel, type) {
    const options = Object.assign({}, statementDataModel, { store: this })
    let statement

    if (type === 'class') {
      statement = new ClassNode(options)
    }

    if (type === 'note') {
      statement = new NoteNode(options)
    }

    this.statementList.push(statement)
    this.add(statement)
    return statement
  }

  dragNewTransition(statement) {
    if (this.workState === WORK_STATE.NORMAL) {
      this.mouseEvent = new DragNewTransition({
        store: this,
        from: statement.getCenter(),
        fromState: statement,
        done: (transitionDataModel, isToEndState = false) => {
          this.mouseEvent = null
          this.workState = WORK_STATE.NORMAL
          if (transitionDataModel) {
            const transition = this.addNewTransition(transitionDataModel)
            if (isToEndState) {
              events.$emit('xsm:editPropertyPanel', {
                element: transition,
                triggerTime: 'afterInsert',
                colorList: this.colorList,
              })
            }
          }
        },
      })
      this.mouseEvent.setMouseDown()
      this.workState = WORK_STATE.DRAG_NEW_TRANSITION
    }
  }

  addNewTransition(transitionDataModel) {
    if (transitionDataModel.fromStateId && !transitionDataModel.fromState) {
      transitionDataModel.fromState = this.statementList.find(statement => statement.id === transitionDataModel.fromStateId)
    }
    if (transitionDataModel.toStateId && !transitionDataModel.toState) {
      transitionDataModel.toState = this.statementList.find(statement => statement.id === transitionDataModel.toStateId)
    }
    const options = { ...transitionDataModel, store: this, brotherIndex: 1 }
    const transition = new Transition(options)
    this.transitionList.push(transition)
    this.add(transition)

    return transition
  }

  // 导出全量数据
  exportData() {
    return {
      x: this.x,
      y: this.y,
      diagramMode: this.diagramMode,
      statementList: this.statementList.map(statement => statement.exportData()),
      transitionList: this.transitionList.map(transition => transition.exportData()),
    }
  }

  removeElement(elementId) {
    elementId = elementId || this.activeElement.id
    if (!elementId) return

    if (/^statement-/.test(elementId)) {
      this.removeStatement(elementId)
    } else {
      this.removeTransition(elementId)
    }
  }

  /**
   * 删除状态节点
   * 连同连接线一并删除
   * @param {*} statement
   */
  removeStatement(id) {
    const index = this.statementList.findIndex(statement => statement.id === id)
    const element = this.children.find(child => child.id === id)
    if (index > -1 && element) {
      this.statementList.splice(index, 1)
      this.remove(element)
      const removeTransitionIds = this.getTransitionsByStatement(id)
      removeTransitionIds.forEach(transitionId => this.removeTransition(transitionId))
    }
  }

  /**
   * 删除连接线
   */
  removeTransition(id) {
    const index = this.transitionList.findIndex(transition => transition.id === id)
    const element = this.children.find(child => child.id === id)
    if (index > -1 && element) {
      this.transitionList.splice(index, 1)
      this.remove(element)
    }
  }

  getTransitionsByStatement(statementId) {
    const removeTransitionIds = []
    this.transitionList.forEach(transition => {
      if (transition.fromStateId === statementId || transition.toStateId === statementId) {
        removeTransitionIds.push(transition.id)
      }
    })
    return removeTransitionIds
  }

  initStatementList(statementList) {
    statementList.forEach(statement => {
      this.addNewStatement(statement, statement.nodeName)
    })
  }

  initTransitionList(transitionList) {
    transitionList.forEach(transition => {
      const fromNode = this.statementList.find(item => item.id === transition.fromStateId)
      const toNode = this.statementList.find(item => item.id === transition.toStateId)
      if (fromNode && toNode) {
        this.addNewTransition(transition)
      }
    })
  }

  setAllNormal() {
    if (this.workState === WORK_STATE.MULTI_SELECTED) return
    this.workState = WORK_STATE.NORMAL
    this.activeNode = undefined
    this.selectedNodes = []
    events.$emit('xClass:closeMultiProperty')
    this.statementList.forEach(statement => {
      statement.setActive(false)
    })
    this.transitionList.forEach(transition => transition.setActive(false))
  }

  updateElementName(payload) {
    const { newName, refMenuNode } = payload
    let node

    if (refMenuNode.Type === ELEMENT_TYPE.CLASS) {
      node = this.statementList.find(item => item.id === refMenuNode.UUId)
      node.dataModel.name = newName
    }
    if (refMenuNode.Type === ELEMENT_TYPE.CLASS_PROPERTY) {
      node = this.statementList.find(item => item.id === refMenuNode.ParentId)
      node.propertyList.forEach(item => {
        if (item.key === refMenuNode.UUId) {
          item.name = newName
        }
      })
      node.dataModel.propertyList.forEach(item => {
        if (item.key === refMenuNode.UUId) {
          item.name = newName
        }
      })
    }
    if (refMenuNode.Type === ELEMENT_TYPE.CLASS_OPERATION) {
      node = this.statementList.find(item => item.id === refMenuNode.ParentId)
      node.operationList.forEach(item => {
        if (item.key === refMenuNode.UUId) {
          item.name = newName
        }
      })
      node.dataModel.operationList.forEach(item => {
        if (item.key === refMenuNode.UUId) {
          item.name = newName
        }
      })
    }

    node.updateData(node.dataModel)
  }

  getApex() {
    const apex = {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    }

    window.store.statementList.forEach(node => {
      if (node.x < apex.minX) {
        apex.minX = node.x
      }
      if (node.y < apex.minY) {
        apex.minY = node.y
      }
      if (node.x + node.width + TOOL_WIDTH > apex.maxX) {
        apex.maxX = node.x + node.width + TOOL_WIDTH
      }
      if (node.y + node.height > apex.maxY) {
        apex.maxY = node.y + node.height
      }
    })

    return apex
  }

  getSize() {
    const gap = 200
    const apex = this.getApex()
    const width = apex.maxX - apex.minX + gap + (window.store.x > 0 ? window.store.x : 0)
    const height = apex.maxY - apex.minY + gap + (window.store.y > 0 ? window.store.y : 0)

    return { width, height }
  }

  adjustSize() {
    const size = this.getSize()

    window.stage.el.setAttribute('width', Math.max(1000, size.width, window.innerWidth))
    window.stage.el.setAttribute('height', Math.max(1000, size.height, window.innerHeight))

    const panLayer = document.querySelector('#pan_satge_layer')

    panLayer.style.width = Math.max(1000, size.width, window.innerWidth) + 'px'
    panLayer.style.height = Math.max(1000, size.height, window.innerHeight) + 'px'
  }
}
