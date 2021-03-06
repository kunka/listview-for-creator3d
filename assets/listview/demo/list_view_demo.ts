
import { Component, Label, Node, _decorator } from 'cc';
import { ListView } from '../script/list_view';
const { ccclass, property } = _decorator;

const allItems:number[] = [];
for (let i = 0; i < 1000; i++) {
  allItems.push(i);
}

@ccclass('ListViewDemo')
export class ListViewDemo extends Component {
  @property(ListView) listView: ListView;

  start() {

  }

  set5Items() {
    const items = allItems.slice(0, 5);
    this.listView.setDelegate({
      items: () => items,
      reuse(itemNode: Node, item: number) {
        itemNode.getChildByName('label').getComponent(Label).string = `item ${item}/${items.length}`;
      }
    });
    this.listView.reload();
  }

  set20Items() {
    const items = allItems.slice(0, 20);
    this.listView.setDelegate({
      items: () => items,
      reuse(itemNode: Node, item: number) {
        itemNode.getChildByName('label').getComponent(Label).string = `item ${item}/${items.length}`;
      }
    });
    this.listView.reload();
  }

  set1000Items() {
    const items = allItems;
    this.listView.setDelegate({
      items: () => items,
      reuse(itemNode: Node, item: number) {
        itemNode.getChildByName('label').getComponent(Label).string = `item ${item}/${items.length}`;
      }
    });
    this.listView.reload();
  }
}

