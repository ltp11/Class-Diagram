<template>
  <div class="class_diagram_container">
    <ToolBox :mode="diagramMode" @dragNewStatement="dragNewStatement" :isShowKeyTips.sync="isShowKeyTips" />
    <div class="tip_box">{{ tip }}</div>
    <div class="work_space" ref="workSpace">
      <div id="svingRoot" class="sving_root" tabindex="1">
        <div id="pan_satge_layer"></div>
      </div>
      <InsertBoard
        :position="insertBoard.position"
        :show="insertBoard.show"
        :getData="getData"
        @cancelAddNew="cancelAddNew"
        @createNewStatement="createNewStatement"
      />
      <RelationBoard
        :position="relationBoard.position"
        :show="relationBoard.show"
        :getData="getData"
        @cancelAddNew="cancelAddNew"
        @createNewTransition="createNewTransition"
      />
      <PropertyPanel />
      <KeyTips :isShowKeyTips.sync="isShowKeyTips" />
      <!-- <Overview
        class="overview"
        :viewport="viewport"
        @viewport-changed="onViewportChanged"
        @viewport-changing="onViewportChanging"
        backgroundImage="https://assets.processon.com/chart_image/thumb/5e113f5ce4b07ae2d018ed5d.png"
        title="测试缩略图"
      /> -->
    </div>
    <MultiProperty />
  </div>
</template>

<script>
import events from './core/events'
import _ from 'lodash'
import { updateClassDiagram, getClassDiagramDetailByDiagramId, checkUpdateAuth } from '../../server'
import { getParameterByName } from '../../x-ide/libs/utils'

import ClassStore from './core/store.js'
import ClassNode from './core/statement/class-node.js'

import {
  CLASS_WIDTH_MIN,
  CLASS_HEIGHT_MIN,
  KEYCODE,
  SVG_WIDTH,
  SVG_HEIGHT,
  WORK_STATE,
  ELEMENT_TYPE,
} from './constants'

import ToolBox from './toolbox/toolbox'
import InsertBoard from '../contextmenu/insert-board'
import RelationBoard from '../contextmenu/relation-board'
import PropertyPanel from '../propertypanel'
import ClassDiagram from '../../x-ide/extend/class-diagram'
import Overview from '../overview'
import KeyTips from '../key-tips'

import MultiProperty from '../../x-ide/extend/multi-property'

const isProject = getParameterByName('projectId')
window.stage = null
window.store = null
window.diagramData = {}

export default {
  name: 'XClassDiagram',
  components: {
    ToolBox,
    InsertBoard,
    RelationBoard,
    PropertyPanel,
    Overview,
    KeyTips,
    MultiProperty,
  },
  props: {
    id: Number,
    name: String,
  },
  data() {
    return {
      tip: '',
      diagramMode: '',
      isUpdating: false,
      isVisitor: isProject ? true : false,
      isShowKeyTips: false,

      insertBoard: {
        show: false,
        position: {
          x: 800,
          y: 400,
        },
        done: () => {},
      },
      relationBoard: {
        show: false,
        position: {
          x: 800,
          y: 400,
        },
        done: () => {},
      },
    }
  },
  mounted() {
    console.log('初始化')
    this.checkUpdateAuth()
    this.initStage()
    this.initMessage()
    this.initEvent()
    ide.store.state.toolbar.forEach(item => {
      if (item) {
        item.hide = false
      }
    })
  },
  destroyed() {
    this.destory()
  },
  methods: {
    initEvent() {
      events.$on('xClass:showInsertBoard', ({ origin, point, position, callback }) => {
        // insertBoard vue组件的绝对定位
        const { scale } = window.store
        this.insertBoard.position = {
          x: point.x * scale + origin.x,
          y: point.y * scale + origin.y,
        }
        this.insertBoard.svgPoint = point
        this.insertBoard.newPos = position
        this.insertBoard.show = true
        this.insertBoard.done = (statement, relation) => {
          this.insertBoard.done = () => {}
          this.insertBoard.show = false
          callback(statement, relation)
        }
      })

      events.$on('xClass:showRelationBoard', ({ origin, point, position, callback }) => {
        // relationBoard vue组件的绝对定位
        const { scale } = window.store
        this.relationBoard.position = {
          x: point.x * scale + origin.x,
          y: point.y * scale + origin.y,
        }
        this.relationBoard.svgPoint = point
        this.relationBoard.newPos = position
        this.relationBoard.show = true
        this.relationBoard.done = relation => {
          this.relationBoard.done = () => {}
          this.relationBoard.show = false
          callback(relation)
        }
      })

      events.$on('xClass:cancelAddNew', () => {
        this.cancelAddNew()
      })

      events.$on('xClass:autoSaveTip', tip => (this.tip = tip || ''))

      events.$on('xClass:autoSave', () => {
        this.update()
      })
    },
    initStage() {
      if (
        isProject &&
        ide.store.state.XWModelDiagramPo &&
        ide.store.state.XWModelDiagramPo.DiagramId === ide.store.state.shareId
      ) {
        ide.store.state.dataVersion = ide.store.state.XWModelDiagramPo.DataVersion
        diagramData =
          ide.store.state.XWModelDiagramPo.ExtendJSONData === ''
            ? {}
            : JSON.parse(ide.store.state.XWModelDiagramPo.ExtendJSONData)
        const { x = 0, y = 0, diagramMode = 'domain', statementList = [], transitionList = [] } = diagramData

        this.diagramMode = diagramMode
        stage = new sving.Stage('#svingRoot', SVG_WIDTH, SVG_HEIGHT)
        store = new ClassStore({ stage, x, y, diagramMode, statementList, transitionList })
        store.scale = ide.store.state.scale

        stage.add(store)
      } else {
        ide.showLoading('数据加载中...')
        getClassDiagramDetailByDiagramId({ diagramId: ide.store.state.shareId })
          .then(res => {
            if (res.code === 0) {
              ide.store.state.dataVersion = res.XWModelDiagramPo.DataVersion
              diagramData =
                res.XWModelDiagramPo.ExtendJSONData === '' ? {} : JSON.parse(res.XWModelDiagramPo.ExtendJSONData)
              const { x = 0, y = 0, diagramMode = 'domain', statementList = [], transitionList = [] } = diagramData

              this.diagramMode = diagramMode
              stage = new sving.Stage('#svingRoot', SVG_WIDTH, SVG_HEIGHT)
              store = new ClassStore({ stage, x, y, diagramMode, statementList, transitionList })
              store.scale = ide.store.state.scale

              stage.add(store)
            } else {
              this.$message({
                type: 'error',
                message: res.returnMsg,
              })
            }
          })
          .finally(() => {
            ide.hideLoading()
          })
      }
    },
    initMessage() {
      window.addEventListener('message', receiveMessage, false)

      function receiveMessage(event) {
        console.log('receiveMessage -> event.data.payload', event.data.payload)
        switch (event.data.type) {
          case 'xwatt-project:clickMenuItem:modelDiagram':
            // 选中图（刷新图）
            break
          case 'xwatt-project:modeltree:deleteElement':
            // 删除元素）
            if (event.data.payload.Type === ELEMENT_TYPE.CLASS) {
              window.store.removeElement(event.data.payload.UUId)
              this.update()
            }
            if (event.data.payload.Type === ELEMENT_TYPE.CLASS_PROPERTY) {
              const node = window.store.statementList.find(item => item.id === event.data.payload.ParentId)
              const propertyIndex = node.propertyList.findIndex(item => item.key === event.data.payload.UUId)

              node.propertyList.splice(propertyIndex, 1)
              const propertyIndexData = node.dataModel.propertyList.findIndex(
                item => item.key === event.data.payload.UUId
              )

              node.dataModel.propertyList.splice(propertyIndexData, 1)
              node.updateData(node.dataModel)
            }
            if (event.data.payload.Type === ELEMENT_TYPE.CLASS_OPERATION) {
              const node = window.store.statementList.find(item => item.id === event.data.payload.ParentId)
              const operationIndex = node.operationList.findIndex(item => item.key === event.data.payload.UUId)

              node.operationList.splice(operationIndex, 1)
              const operationIndexData = node.dataModel.operationList.findIndex(
                item => item.key === event.data.payload.UUId
              )

              node.dataModel.operationList.splice(operationIndexData, 1)
              node.updateData(node.dataModel)
            }
            break
          case 'xwatt-project:modeltree:renameElement':
            // 重命名元素
            window.store.updateElementName(event.data.payload)
            break
          case 'xwatt-project:clickMenuItem:modelElement':
            // 选中元素
            if (event.data.payload.Type === ELEMENT_TYPE.CLASS) {
              window.store.setActiveNodeByUUID(event.data.payload.UUId)
            }
            if (
              event.data.payload.Type === ELEMENT_TYPE.CLASS_PROPERTY ||
              event.data.payload.Type === ELEMENT_TYPE.CLASS_OPERATION
            ) {
              window.store.setActiveNodeByUUID(event.data.payload.ParentId)
            }
            break
          case 'xwatt-project:modeltree:addElement':
            // 暂不处理
            // 添加到当前图，共享
            break
          case 'xwatt-project:clickTab':
            // 点击 tab 时重新渲染
            window.store.initRender(window.store.exportData())
            break
        }
      }
    },
    dragNewStatement({ e, type }) {
      store.dragNewStatement(e, type)
    },
    createNewStatement(type, relation) {
      const position = type === 'class' ? this.insertBoard.newPos : this.insertBoard.svgPoint
      const dataModel = {
        nodeName: type,
        x: position.x,
        y: position.y,
        width: CLASS_WIDTH_MIN,
        height: CLASS_HEIGHT_MIN,
      }

      const statement = store.addNewStatement(dataModel, type)
      this.insertBoard.done(statement, relation)
    },
    createNewTransition(relation) {
      this.relationBoard.done(relation)
    },
    cancelAddNew() {
      this.insertBoard.done()
      this.relationBoard.done()
    },
    getData() {
      return store.exportData()
    },
    checkUpdateAuth() {
      if (getParameterByName('id') === 'new') {
        this.isVisitor = false
        return
      }
      if (isProject) {
        checkUpdateAuth()
          .then(res => {
            if (res.code === 0 && res.data && res.data.auth === 1) {
              this.isVisitor = false
            } else {
              this.visitorTip()
            }
          })
          .catch(e => {
            this.isVisitor = true
            this.visitorTip()
          })
      }
    },
    visitorTip() {
      this.$notify.closeAll()
      this.$notify({
        title: '警告',
        type: 'info',
        message: '当前为游客模式，编辑不会保存',
        offset: 140,
        duration: 0,
      })
    },
    destory() {
      events.$off()
      window.stage && window.stage.clear()
      window.stage = null
      window.store = null
      window.diagramData = {}
    },
    update: _.debounce(function() {
      if (this.isVisitor) {
        this.visitorTip()
        return
      }
      if (this.isUpdating) {
        this.update()
        return
      }
      this.isUpdating = true
      events.$emit('xClass:autoSaveTip', '保存中，请勿离开当前页面')
      const JSONData = JSON.stringify(store.exportData())
      const params = { JSONData, name: this.name, diagramId: this.id }
      console.log('自动保存数据啦')
      updateClassDiagram(params)
        .then(res => {
          if (res.code === 0) {
            ide.store.state.dataVersion = res.XWModelDiagramPo.DataVersion
            events.$emit('xClass:autoSaveTip', '保存成功')
          } else if (res.code === 101 || res.code === 102) {
            events.$emit('xClass:autoSaveTip', '')
            if (res.code === 101) {
              this.$notify.closeAll()
              this.$notify({
                title: '警告',
                type: 'warning',
                message: res.returnMsg,
                offset: 140,
                duration: 0,
              })
            } else {
              this.$message({
                type: 'warning',
                message: res.returnMsg,
              })
            }

            ide.store.state.dataVersion = res.XWModelDiagramPo.DataVersion
            diagramData =
              res.XWModelDiagramPo.ExtendJSONData === '' ? {} : JSON.parse(res.XWModelDiagramPo.ExtendJSONData)
            const { x = 0, y = 0, diagramMode = 'domain', statementList = [], transitionList = [] } = diagramData

            this.diagramMode = diagramMode
            store.scale = ide.store.state.scale
            store.initRender({ x, y, diagramMode, statementList, transitionList })
          } else {
            events.$emit('xClass:autoSaveTip', res.returnMsg || '保存失败')
          }
        })
        .catch(e => {
          this.$message({
            type: 'error',
            message: e.toString() || '保存失败',
          })
        })
        .finally(() => {
          this.isUpdating = false
          //刷新模型树，不带loading
          window.parent.postMessage(
            {
              type: 'xwatt-project:refresh-model-tree',
            },
            '*'
          )
          setTimeout(() => {
            events.$emit('xClass:autoSaveTip', '')
          }, 1000)
        })
    }, 1000),
  },
}
</script>

<style lang="less" scoped>
.class_diagram_container {
  position: relative;
  padding-top: 40px;
  height: 100%;
  .work_space {
    position: relative;
    width: 100%;
    height: 100%;
    .overview {
      position: fixed;
      top: 150px;
      right: 20px;
    }
    #pan_satge_layer {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
  }
  .sving_root {
    width: 100%;
    height: 100%;
  }
  .tip_box {
    color: #666;
    position: absolute;
    top: 42px;
    right: 14px;
  }
}
</style>
