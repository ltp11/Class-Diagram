import LinkedList from './linked-list';

export default class Stack {
  constructor(maxStep = 20) {
    this.linkedList = new LinkedList();
    this.maxStep = maxStep;
  }

  get length() {
    return this.linkedList.toArray().length;
  }

  isEmpty() {
    return !this.linkedList.head;
  }

  isMaxStack() {
    return this.toArray().length >= this.maxStep;
  }

  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.linkedList.head.value;
  }

  push(value) {
    this.linkedList.prepend(value);
    if (this.length > this.maxStep) {
      this.linkedList.deleteTail();
    }
  }

  pop() {
    const removeHead = this.linkedList.deleteHead();
    return removeHead ? removeHead.value : null;
  }

  toArray() {
    return this.linkedList.toArray();
  }

  clear() {
    while (!this.isEmpty()) {
      this.pop();
    }
  }
}
