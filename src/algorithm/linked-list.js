export class LinkedListNode {
  constructor(value, next) {
    this.value = value;
    this.next = next;
  }

  toString(callback) {
    return callback ? callback(this.value) : `${this.value}`;
  }
}

export default class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  /**
   * 将指定元素添加到链表头部
   * @param {*} value
   */
  prepend(value) {
    const newNode = new LinkedListNode(value, this.head);
    this.head = newNode;
    if (!this.tail) {
      this.tail = newNode;
    }
    return this;
  }

  /**
   * 将指定元素添加到链表尾部
   * @param {*} value
   */
  append(value) {
    const newNode = new LinkedListNode(value);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;

      return this;
    }

    this.tail.next = newNode;
    this.tail = newNode;

    return this;
  }

  /**
   * 删除指定元素
   * @param {*} value
   */
  delete(value) {
    if (!this.head) {
      return null;
    }

    let deleteNode = null;

    while (this.head && this.head.value === value) {
      deleteNode = this.head;
      this.head = this.head.next;
    }

    let currentNode = this.head;

    if (currentNode !== null) {
      while (currentNode.next) {
        if (currentNode.next.value === value) {
          deleteNode = currentNode.next;
          currentNode.next = currentNode.next.next;
        } else {
          currentNode = currentNode.next;
        }
      }
    }

    if (this.tail.value === value) {
      this.tail = currentNode;
    }

    return deleteNode;
  }

  /**
   * 查找指定元素
   * @param {*} param0
   */
  find({ value, callback }) {
    if (!this.head) {
      return null;
    }

    let currentNode = this.head;

    while (currentNode) {
      if (callback && callback(currentNode.value)) {
        return currentNode;
      }

      if (value !== undefined && currentNode.value === value) {
        return currentNode;
      }

      currentNode = currentNode.next;
    }

    return null;
  }

  /**
   * 删除尾部节点
   */
  deleteTail() {
    if (!this.tail) {
      return null;
    }

    const deleteTail = this.tail;

    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
      return deleteTail;
    }

    let currentNode = this.head;
    while (currentNode) {
      if (currentNode.next.next) {
        currentNode = currentNode.next;
      } else {
        currentNode.next = null;
      }
    }

    this.tail = currentNode;
    return deleteTail;
  }

  /**
   * 删除头部节点
   */
  deleteHead() {
    if (!this.head) {
      return null;
    }

    const deleteHead = this.head;

    if (this.head.next) {
      this.head = this.head.next;
    } else {
      this.head = null;
      this.tail = null;
    }

    return deleteHead;
  }

  /**
   * 将一组元素转换成链表
   * @param {*} values
   */
  fromArray(values) {
    values.forEach(value => this.append(value));
    return this;
  }

  /**
   * 转换成数组元素
   */
  toArray() {
    const nodes = [];

    let currentNode = this.head;

    while (currentNode) {
      nodes.push(currentNode.value);
      currentNode = currentNode.next;
    }

    return nodes;
  }

  /**
   * 翻转链表元素
   */
  reverse() {
    let currentNode = this.head;
    let prevNode = null;
    let nextNode = null;

    while (currentNode) {
      nextNode = currentNode.next;
      currentNode.next = prevNode;

      prevNode = currentNode;
      currentNode = nextNode;
    }

    this.tail = this.head;
    this.head = prevNode;
  }

  toString(callback) {
    return this.toArray().map(node => node.toString(callback))
      .toString();
  }
}
