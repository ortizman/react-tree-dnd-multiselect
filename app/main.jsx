import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  TreeView,
  TreeViewDragClue,
  processTreeViewItems,
  moveTreeViewItem,
  TreeViewDragAnalyzer,
} from '@progress/kendo-react-treeview';

function getSiblings(itemIndex, data) {
  let result = data;
  const indices = itemIndex.split(SEPARATOR).map((index) => Number(index));

  for (let i = 0; i < indices.length - 1; i++) {
    result = result[indices[i]].items || [];
  }

  return result;
}

const SEPARATOR = '_';
const treeData = [
  {
    text: 'Furniture',
    expanded: true,
    items: [
      {
        text: 'Tables & Chairs',
      },
      {
        text: 'Sofas',
      },
      {
        text: 'Occasional Furniture',
      },
    ],
  },
  {
    text: 'Decor',
    expanded: true,
    items: [
      {
        text: 'Bed Linen',
      },
      {
        text: 'Curtains & Blinds',
      },
      {
        text: 'Carpets',
      },
    ],
  },
];

const App = () => {
  const dragClue = React.useRef();
  const dragOverCnt = React.useRef(0);
  const isDragDrop = React.useRef(false);
  const [tree, setTree] = React.useState(treeData);
  const [expand, setExpand] = React.useState({
    ids: [],
    idField: 'text',
  });
  const [selected, setSelected] = React.useState({
    ids: [],
    idField: 'text',
  });

  const [hierarchicalsSelected, setHierarchicalsSelected] = React.useState([]);

  const getClueClassName = (event) => {
    const eventAnalyzer = new TreeViewDragAnalyzer(event).init();
    const { itemHierarchicalIndex: itemIndex } = eventAnalyzer.destinationMeta;

    if (eventAnalyzer.isDropAllowed) {
      switch (eventAnalyzer.getDropOperation()) {
        case 'child':
          return 'k-i-plus';

        case 'before':
          return itemIndex === '0' || itemIndex.endsWith(`${SEPARATOR}0`)
            ? 'k-i-insert-up'
            : 'k-i-insert-middle';

        case 'after':
          const siblings = getSiblings(itemIndex, tree);
          const lastIndex = Number(itemIndex.split(SEPARATOR).pop());
          return lastIndex < siblings.length - 1
            ? 'k-i-insert-middle'
            : 'k-i-insert-down';

        default:
          break;
      }
    }

    return 'k-i-cancel';
  };

  const onItemDragOver = (event) => {
    dragOverCnt.current++;
    dragClue.current.show(
      event.pageY + 10,
      event.pageX,
      selected.ids.join(','),
      getClueClassName(event)
    );
  };

  const onItemDragEnd = (event) => {
    isDragDrop.current = dragOverCnt.current > 0;
    dragOverCnt.current = 0;
    dragClue.current.hide();
    const eventAnalyzer = new TreeViewDragAnalyzer(event).init();

    if (eventAnalyzer.isDropAllowed) {
      const hierarchicalsIds = hierarchicalsSelected.slice();
      setHierarchicalsSelected([]);
      const dest = eventAnalyzer.destinationMeta.itemHierarchicalIndex;
      const oper = eventAnalyzer.getDropOperation() || 'child';
      let updatedTree = tree;
      hierarchicalsIds
        .sort(
          (a, b) =>
            Number(a.split('_').join('')) - Number(b.split('_').join(''))
        )
        .reverse()
        .forEach((itemHierarchicalIndex) => {
          updatedTree = moveTreeViewItem(
            itemHierarchicalIndex,
            updatedTree,
            oper,
            dest
          );
          console.log(updatedTree);
        });
      console.log(updatedTree);
      setTree(updatedTree);
      setSelected({
        ids: [],
      });
    }
  };

  const onItemClick = (event) => {
    let ids;
    let hierarchicalsIds;
    if (!isDragDrop.current && event.nativeEvent.shiftKey) {
      ids = selected.ids.slice();
      const index = ids.indexOf(event.item.text);
      index === -1 ? ids.push(event.item.text) : undefined;

      const sorted = ids.sort(
        (a, b) =>
          Number(a.split(SEPARATOR).join('')) -
          Number(b.split(SEPARATOR).join(''))
      );

      const firstItem = sorted[0].split(SEPARATOR).map(Number);
      const lastItem = sorted[sorted.length - 1].split(SEPARATOR).map(Number);

      // tienen que ser del mismo padre
      if (
        JSON.stringify(firstItem.slice(0, -1)) ===
        JSON.stringify(lastItem.slice(0, -1))
      ) {
        ids = [];
        const lastIndex = firstItem.length - 1;

        while (firstItem[lastIndex] !== lastItem[lastIndex]) {
          ids.push(firstItem.join(SEPARATOR));
          firstItem[lastIndex] = firstItem[lastIndex] + 1;
        }
      }
    } else if (!isDragDrop.current && event.nativeEvent.ctrlKey) {
      ids = selected.ids.slice();
      const index = ids.indexOf(event.item.text);
      index === -1 ? ids.push(event.item.text) : ids.splice(index, 1);

      hierarchicalsIds = hierarchicalsSelected.slice();
      const hIndex = hierarchicalsIds.indexOf(event.itemHierarchicalIndex);
      hIndex === -1
        ? hierarchicalsIds.push(event.itemHierarchicalIndex)
        : hierarchicalsIds.splice(hIndex, 1);
    } else {
      ids = [event.item.text];
      hierarchicalsIds = [event.itemHierarchicalIndex];
    }

    setSelected({
      ids,
      idField: 'text',
    });
    setHierarchicalsSelected(hierarchicalsIds);
  };

  const onExpandChange = (event) => {
    let ids = expand.ids.slice();
    const index = ids.indexOf(event.item.text);
    index === -1 ? ids.push(event.item.text) : ids.splice(index, 1);
    setExpand({
      ids,
      idField: 'text',
    });
  };

  return (
    <div>
      <TreeView
        draggable={true}
        onItemClick={onItemClick}
        onItemDragOver={onItemDragOver}
        onItemDragEnd={onItemDragEnd}
        data={processTreeViewItems(tree, {
          expand: expand,
          select: selected,
        })}
        expandIcons={true}
        onExpandChange={onExpandChange}
      />
      <TreeViewDragClue ref={dragClue} />
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector('my-app'));
