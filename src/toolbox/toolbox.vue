<template>
  <div class="xsm-tool-bar">
    <div class="tool">
      <div class="graph-list">
        <div
          v-for="shape in STATEMENT_SHAPE"
          :key="shape.type"
          class="graph-item"
          :class="{ 'graph-item_disabled': shape.disabled }"
          @mousedown="addNew(arguments[0], shape)"
        >
          <el-tooltip class="item" effect="dark" :content="shape.tip" placement="bottom">
            <img :src="shape.icon" alt="" ondragstart="return false" />
          </el-tooltip>
        </div>
        <!-- <div class="graph-item graph-item-undo" :class="{'disabled': !undoable}">
          <i class="tool-icon el-icon-back"></i>
        </div>
        <div class="graph-item graph-item-redo" :class="{'disabled': !redoable}">
          <i class="tool-icon el-icon-right"></i>
        </div> -->
        <!-- <div class="graph-item" v-if="isAdmin">
          <el-upload
            action="/"
            :limit="1"
            accept="json"
            :before-upload="importJson"
          >
            <el-button size="mini">导入json</el-button>
          </el-upload>
        </div> -->
      </div>
    </div>
    <el-link icon="el-icon-question" type="info" @click="$emit('update:isShowKeyTips', true)">快捷键说明</el-link>
    <el-radio-group v-model="diagramMode" size="mini" class="type_select">
      <el-radio-button label="class">显示详情</el-radio-button>
      <el-radio-button label="domain">隐藏详情</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import events from '../core/events'
import { cloneDeep } from 'lodash'

import { STATEMENT_SHAPE } from '../constants'
import { KEYCODE } from '../constants'

export default {
  name: 'ToolBox',
  props: {
    mode: String,
  },
  data() {
    return {
      STATEMENT_SHAPE,
      diagramMode: this.mode,
      undoable: false,
      redoable: false,
      isAdmin: ide.store.state.isAdmin
    }
  },
  watch: {
    mode(mode) {
      this.diagramMode = mode
    },
    diagramMode(diagramMode, old) {
      events.$emit('xClass:setMode', diagramMode)
      old && events.$emit('xClass:autoSave')
    },
  },
  mounted() {
    this.bindEvents()
  },
  methods: {
    bindEvents() {
      // console.log('window.store', window.store)
      // document.onkeydown = e => {
      //   if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.keyCode === KEYCODE.Z) {
      //     this.redo()
      //     return 
      //   }

      //   if ((e.metaKey || e.ctrlKey) && e.keyCode === KEYCODE.Z) {
      //     this.undo()
      //     return 
      //   }
      // }
      events.$on('xClass:stackchange', stack => {
        const { undoStack, redoStack } = stack
        const undoLen = undoStack.length
        const redoLen = redoStack.length

        this.undoable = undoLen > 0
        this.redoable = redoLen !== 0
      });
    },
    undo() {
      const undoStack = store.getUndoStack()
      if (!undoStack || undoStack.length === 0) {
        return 
      }
      const currentData = undoStack.pop()
      if (currentData) {
        const { action } = currentData
        let data = currentData.data.before
        if (!data) return 
        store.clearStage()

        store.x = data.x
        store.y = data.y
        store.initStatementList(cloneDeep(data.statementList))
        store.initTransitionList(cloneDeep(data.transitionList))

        store.pushStack(action, cloneDeep(currentData.data), 'redo')
      }

    },
    redo() {
      const redoStack = store.getRedoStack()
      if (!redoStack || redoStack.length === 0) {
        return 
      }
      const currentData = redoStack.pop()
      if (currentData) {
        const { action } = currentData
        let data = currentData.data.after
        if (!data) return 
        store.clearStage()

        store.x = data.x
        store.y = data.y
        store.initStatementList(cloneDeep(data.statementList))
        store.initTransitionList(cloneDeep(data.transitionList))

        store.pushStack(action, cloneDeep(currentData.data), 'undo', false)
      }
    },
    addNew(e, shape) {
      if (!shape.disabled) {
        this.$emit('dragNewStatement', { e, type: shape.type })
      }
    },
    importJson(file) {
      const reader = new FileReader()
      reader.readAsText(file, 'UTF-8')
      reader.onload = e => {
        const content = e.target.result
        try {
          store.initRender(JSON.parse(content))
          events.$emit('xClass:autoSave')
        } catch (e) {
          throw e
        }
      }
    },
  },
}
</script>

<style lang="less" scoped>
.xsm-tool-bar {
  position: relative;
  display: flex;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 40px;
  left: 0;
  top: 0;
  background-color: #f4f4f4;
  display: flex;
  z-index: 99;
  padding-right: 10px;
  .type_select {
    float: right;
    margin-left: 10px;
  }
  .tool {
    display: flex;
    flex: 1;
    .title {
      display: flex;
      align-items: center;
      padding: 0 10px;
      font-size: 13px;
      text-align: center;
      font-weight: 500;
    }
    .graph-list {
      display: flex;
    }
    .graph-item {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      text-align: center;
      font-size: 12px;
      font-weight: 300;
      user-select: none;
      cursor: copy;
      img {
        width: 25px;
        height: 25px;
      }
    }
    .graph-item-redo, .graph-item-undo {
      font-size: 16px;
      cursor: pointer;
    }
    .active {
      color: #07c160;
    }
    .graph-item_disabled {
      color: #b0b0b0;
      cursor: no-drop;
    }
  }
  .disabled {
    color: #909399;
    cursor: not-allowed;
    &:hover {
      color: #909399;
    }
  }
}
</style>
