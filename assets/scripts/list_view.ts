
import { Component, instantiate, Node, NodePool, ScrollView, UITransform, Vec3, _decorator } from 'cc';
const { ccclass, property } = _decorator;

export interface ListViewDelegate<T>{
  items(): T[];
  reuse?(itemNode:Node, item:T): void;
  unuse?(itemNode:Node): void;
}

// temp val
const itemIndex = new Set<number>();
const vec3 = new Vec3;
@ccclass('ListView')
export class ListView extends Component {
  @property(Node) itemTemplate: Node;
  @property spaceY = 0;
  scrollView: ScrollView;
  private itemHeight:number;
  private itemPool: NodePool = new NodePool();
  private dataSource:any[] = [];
  private visibleHeight: number;
  private spawnCount: number;
  private visibleNodes = new Map<number, Node>();
  private delegate: ListViewDelegate<any> = { items: () => [] };

  onLoad() {
    this.scrollView = this.getComponent(ScrollView);
    this.itemHeight = this.itemTemplate.getComponent(UITransform).height;
    this.itemPool.put(this.itemTemplate);
    this.visibleHeight = this.node.getComponent(UITransform).height;
    this.spawnCount = Math.round(this.visibleHeight / this.itemHeight) + 1;
    this.ensure(this.spawnCount);
    console.log('ListView visibleHeight:', this.visibleHeight, 'spawnCount:', this.spawnCount, 'itemHeight:', this.itemHeight);
  }

  setDelegate<T>(delegate:ListViewDelegate<T>) {
    this.delegate = delegate;
  }

  reload() {
    this.dataSource = this.delegate.items();
    const totalHeight = this.itemHeight * this.dataSource.length + (this.spaceY * Math.max(0, this.dataSource.length - 1));
    this.scrollView.content.getComponent(UITransform).height = totalHeight;
    const children = this.scrollView.content.children.slice();
    children.forEach(c => this.itemPool.put(c));  // [warning] not call unuse
    // @ts-ignore
    this.scrollView.content._children.length = 0;
    this.visibleNodes.clear();
    this.scrollView.stopAutoScroll();
    this.scrollView.scrollToTop(0, false);
    this.lastY = Number.MIN_SAFE_INTEGER;
    console.log('ListView reload totalCount:', this.dataSource.length);
  }

  ensure(count: number) {
    while (this.itemPool.size() < count) {
      this.itemPool.put(instantiate(this.itemTemplate));
    }
  }

  lastY: number = Number.MIN_SAFE_INTEGER;
  lateUpdate() {
    const y = Math.floor(this.scrollView.getScrollOffset().y);
    if (this.lastY != y) {
      this.lastY = y;
      this.getVisibleItemIndex(y);
      this.visibleNodes.forEach((node, idx) => {
        if (!itemIndex.has(idx)) {
          this.delegate.unuse && this.delegate.unuse(node);
          this.itemPool.put(node);
          this.visibleNodes.delete(idx);
        }
      });
      itemIndex.forEach((idx) => {
        if (!this.visibleNodes.has(idx)) {
          this.ensure(1);
          const node = this.itemPool.get();
          node.getPosition(vec3);
          vec3.y = (-idx - 0.5) * this.itemHeight - this.spaceY * idx;
          node.setPosition(vec3);
          node.parent = this.scrollView.content;
          this.delegate.reuse && this.delegate.reuse(node, this.dataSource[idx]);
          this.visibleNodes.set(idx, node);
        }
      });
    }
  }

  getVisibleItemIndex(y: number) {
    let minY = Math.max(0, Math.floor(y / (this.itemHeight + this.spaceY)));
    let maxY = minY == 0 ? this.spawnCount : Math.round((y + this.visibleHeight) / (this.itemHeight + this.spaceY));
    const totalCount = this.dataSource.length;
    maxY = Math.min(maxY, totalCount);
    if (maxY == totalCount) {
      minY = Math.max(0, totalCount - this.spawnCount);
    }
    itemIndex.clear();
    for (let i = minY; i < minY + this.spawnCount && i < totalCount; i++) {
      itemIndex.add(i);
    }
  }
}

