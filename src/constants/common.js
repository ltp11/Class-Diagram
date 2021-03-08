// 画布大小
export const SVG_HEIGHT = window.innerHeight
export const SVG_WIDTH = window.innerWidth

// 文字样式
export const TEXT_COLOR = '#2c3e50'
export const TEXT_FONT = '12px sans-serif'
export const TEXT_HEIGHT = 18

// 工具栏宽高
export const TOOL_WIDTH = 25

// 边框样式
export const BORDER_COLOR = '#2c3e50'
export const BORDER_ACTIVE_COLOR = '#0bb955'
export const BORDER_WIDTH = 2
export const BORDER_WIDTH_THIN = 1
export const BORDER_DASHED = '2,2'
export const BORDER_SOLID = '0'

// 节点背景色
export const BACKGROUND_COLOR = '#faecd8'

// 连线颜色
export const LINE_COLOR = '#2c3e50'

// 调整点大小
export const SIZE_POINT_WIDTH = 6

// class 节点最小宽高
export const CLASS_WIDTH_MIN = 100
export const CLASS_HEIGHT_MIN = 86

// class name 样式
export const CLASS_NAME_PADDING = 5
export const CLASS_NAME_HEIGHT = 26

// class peoperty operation 样式
export const CLASS_PROPERTY_HEIGHT = 25
export const PROPERTY_HEIGHT = 20
export const PROPERTY_PADDING = 5

// class 修饰符
export const MODIFIER = {
  public: '+',
  private: '-',
  protected: '#',
  default: '',
}

// note 节点最小宽高
export const NOTE_WIDTH_MIN = 150
export const NOTE_HEIGHT_MIN = 80

// note 折角宽度
export const NOTE_KNUCKLE_WIDTH = 12

// note 内边距
export const NOTE_PADDING = 20

// 工作状态
export const WORK_STATE = {
  NORMAL: 0, // 默认状态
  DRAG_NEW_STATEMENT: 1, // 拖拽状态节点
  DRAG_NEW_TRANSITION: 2, // 拖拽线
  ADJUST_STATEMENT_SIZE: 3, // 调整状态节点大小
  PAN_STATEMENT: 4, // 平移状态节点
  PAN_STAGE: 5, // 整体平移,
  SHIFT_MULTI_SELECTING: 6, // 按住shift正在选中多个
  FRAME_MULTI_SELECTING: 7, // 框选多个
  PAN_MULTI_STATEMENT: 8, // 批量拖动多个节点
  AFTER_PAN_MULTI_STATEMENT: 9, // 批量拖动多个节点后
  DRAG_TRANSITION_ENDPOINT: 10, // 拖动连线端点
  ZOOM_STAGE: 11, // 整体缩放
}

// 绑定在全局的行为事件
export const WINDOW_MOUSEEVENTS = [
  // 拖拽出一个新的状态节点
  WORK_STATE.DRAG_NEW_STATEMENT,
  // 拖拽出一个新的连线
  WORK_STATE.DRAG_NEW_TRANSITION,
  // 调整状态节点大小
  WORK_STATE.ADJUST_STATEMENT_SIZE,
  // 整体平移
  WORK_STATE.PAN_STAGE,
  // 框选多个
  WORK_STATE.FRAME_MULTI_SELECTING,
  // 拖动连线端点
  WORK_STATE.DRAG_TRANSITION_ENDPOINT,
  WORK_STATE.PAN_STATEMENT,
  WORK_STATE.PAN_MULTI_STATEMENT,
  WORK_STATE.NORMAL,
]

// 鼠标 左中右
export const MOUSE = {
  LEFT: 1,
  MIDDLE: 2,
  RIGHT: 3,
}

export const ADJUST_POINT_INDEX = {
  LEFT_TOP: 'left-top',
  RIGHT_TOP: 'right-top',
  LEFT_BOTTOM: 'left-bottom',
  RIGHT_BOTTOM: 'right-bottom',
}

// 节点类型
export const STATEMENT_SHAPE = [
  {
    type: 'class',
    name: 'Class',
    icon: require('../../../assets/icon/class.svg'),
    disabled: false,
    tip: '类（点击拖拽）',
  },
  {
    type: 'note',
    name: 'Note',
    icon: require('../../../assets/icon/note.svg'),
    disabled: false,
    tip: '注释（点击拖拽）',
  },
]

export const TYPE_LIST = [
  { value: 'string' },
  { value: 'int' },
  { value: 'boolean' },
  { value: 'byte' },
  { value: 'char' },
  { value: 'float' },
  { value: 'double' },
  { value: 'long' },
  { value: 'short' },
]
export const RETURN_LIST = [{ value: 'void' }, ...TYPE_LIST]
export const MODIFIER_LIST = ['private', 'public', 'protected']

export const RELATION_LIST = ['Generalization', 'Association', 'Directed Association', 'Dependency', 'Aggregation', 'Composition', 'Realization']
export const RELATION_NAME_MAP = {
  Generalization: '泛化/Generalization',
  Association: '关联/Association',
  'Directed Association': '单向关联/Directed Association',
  Dependency: '依赖/Dependency',
  Aggregation: '聚合/Aggregation',
  Composition: '组合/Composition',
  Realization: '实现/Realizations',
}
export const RELATION_ICON_MAP = {}
RELATION_LIST.forEach(relation => {
  RELATION_ICON_MAP[relation] = require(`../../../assets/icon/${relation}.svg`)
})
const STEREOTYPE_LIST = ['access', 'bind', 'call', 'derive', 'friend', 'import', 'instanceOf', 'instantiate', 'powertype', 'refine', 'send', 'use']
export const RELATION_STEREOTYPE_MAP = {
  Association: ['metaclass', 'subscribe'],
  'Directed Association': ['metaclass', 'subscribe'],
  Dependency: STEREOTYPE_LIST,
  Aggregation: ['metaclass', 'subscribe'],
  Composition: ['metaclass', 'subscribe'],
  Realization: STEREOTYPE_LIST,
  Generalization: ['implementation'],
}
export const RELATION_MULTIPLICITY = [
  { value: '*' },
  { value: '0' },
  { value: '0..*' },
  { value: '0..1' },
  { value: '1' },
  { value: '1..' },
  { value: '1..*' },
]

// 按键
export const KEYCODE = {
  BACKSPACE: 8, // 退格
  DELETE: 46, // delete
  SPACE: 32,
  SHIFT: 16,
  C: 67,
  V: 86,
  A: 65,
  Z: 90,
  ENTER: 13,
}

// 默认颜色
export const COLOR_LIST = [
  '#faecd8',
  '#8B0000',
  '#FF0000',
  '#FFC0CB',
  '#FFE4E1',
  '#D5E1E5',
  '#A52A00',
  '#FF6820',
  '#FFAD5B',
  '#FFD700',
  '#FFFE99',
  '#ACF0FF',
  '#8CD2E1',
  '#004040',
  '#8B8B00',
  '#32CD32',
  '#FFFF00',
  '#FFFFE0',
  '#452863',
  '#8C503E',
  '#EAD2A5',
  '#692884',
  '#005500',
  '#009300',
  '#3CB371',
  '#00FF00',
  '#CCFFCC',
  '#1B73C4',
  '#33CCCC',
  '#00FFFF',
  '#CCFFFF',
  '#00008B',
  '#0000FF',
  '#7D9EC0',
  '#00CCFF',
  '#99CCFF',
  '#4B0082',
  '#7B7BC0',
  '#800080',
  '#EA8066',
  '#CC99FF',
  '#282828',
  '#666666',
  '#7F7F7F',
  '#C0C0C0',
  '#FFFFFF',
]

export const ELEMENT_TYPE = {
  CLASS: 5,
  CLASS_PROPERTY: 6,
  CLASS_OPERATION: 7,
}
