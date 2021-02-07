export default class BaseAction {
  constructor({ store }) {
    this.store = store
    this.actionName = ''
    this.beforeData = null
    this.afterData = null
  }

  before() {
    this.beforeData = this.store.exportData()
  }

  after() {
    this.afterData = this.store.exportData()
    this.store.pushStack(this.actionName, { 
      before: this.beforeData,
      after: this.afterData
    })
  }
}