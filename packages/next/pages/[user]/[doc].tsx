import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor, Node, Text, Transforms, Editor, Operation } from 'slate';
import { Slate, Editable, withReact } from 'slate-react'
import SlateAdapter from '../../components/SlateAdapter';
import { Transform } from 'stream';



const withCustom = (prefix, doc, editor) => {
  const { apply, isElement } = editor;
  const adapter = new SlateAdapter(editor, doc, prefix);
  editor.apply = (op: any) => {
    adapter.handle(op);
    apply(op);
  };
  editor.isElement = (n: any) => {
    return n.type === 'list' || n.type === 'list_item';
  }
  return editor;
};

function Leaf(props) {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >{props.children}</span>
  );
}

function renderLeaf(props) {
  return <Leaf {...props} />;
}

function DefaultElement(props) {
  return (
    <p {...props.attributes}>{props.children}</p>
  );
}

function Block(props) {
  return (
    <div style={{ backgroundColor: "#fc0" }} {...props.attributes}>{props.children}</div>
  );
}

function MainTitle(props) {
  return (
    <h1 {...props.attributes}>{props.children}</h1>
  );
}

function List(props) {
  return (
    <ul {...props.attributes}>
      {props.children}
    </ul>
  );
}

function ListItem(props) {
  return (
    <li {...props.attributes}>{props.children}</li>
  );
}

function renderElement(props) {
  switch (props.element.type) {
    case 'paragraph':
      return <DefaultElement {...props} />;
    case 'block':
      return <Block {...props} />;
    case 'list':
      return <List {...props} />;
    case 'list_item':
      return <ListItem {...props} />;
  }
}

function renderTitleElement(props) {
  switch (props.element.type) {
    case 'main_title':
      return <MainTitle {...props} />;
  }
}

function DocTitle({ doc }) {
  const editor = useMemo(() => withCustom("title", doc, withReact(createEditor())), []);
  const [value, setValue] = useState<any>(doc.data.title);
  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      return;
    }
    switch (event.key) {
      case 'b': {
        event.preventDefault();
        Transforms.setNodes(editor, { bold: true }, {
          match: n => Text.isText(n),
          split: true
        });
        break;
      }
    }
  }, []);
  const onChange = useCallback((newValue) => {
    console.log("Title doc", newValue);
    setValue(newValue);
  }, []);
  return (
    <Slate editor={editor} value={value} onChange={onChange}>
      <Editable
        spellCheck={false}
        renderLeaf={renderLeaf}
        renderElement={renderTitleElement}
        onKeyDown={onKeyDown} />
    </Slate>
  );
}

function Doc({ doc }) {
  const editor = useMemo(() => withCustom("doc", doc, withReact(createEditor())), []);
  const [value, setValue] = useState<any>(doc.data.doc);
  useEffect(() => {
    const onOp = (op, source) => {
      console.log("On op", doc, op, source);
      if (source === false) {

      }
    };
    doc.on('op', onOp);
    return () => {
      doc.removeListener('op', onOp);
    };
  }, []);

  const onChange = useCallback((newValue) => {
    console.log("New slate-doc", newValue);
    setValue(newValue);
  }, []);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey) {
      switch (event.key) {
        case 'b': {
          event.preventDefault();
          Transforms.setNodes(editor, { bold: true }, {
            match: n => Text.isText(n),
            split: true
          });
          break;
        }
        case '+': {
          event.preventDefault();
          Transforms.insertNodes(editor, {
            type: 'block',
            children: [{
              text: ''
            }]
          });
          break;
        }
      }
    } else {
      if (event.which === 9) {
        // Tab
        if (event.shiftKey) {
          // Un-indent current element,
          // Todo: Handle top level un-indent
          // Check for list above the current list
          const currentItem = Editor.above(editor, {
            match: (n) => n.type === 'list_item'
          });
          if (currentItem) {
            const [currentItemNode, currentItemPath] = currentItem;
            const currentListPath = currentItemPath.slice(0, currentItemPath.length - 1);
            const currentList = Node.get(editor, currentListPath);
            // If: [list, item, list, item]
            if (currentItemPath.length >= 4) {
              const parentListItemPath = currentItemPath.slice(0, currentItemPath.length - 2);
              const parentListItem = Node.get(editor, parentListItemPath);
              if (parentListItem.type === 'list_item') {
                // We have an outer list
                const parentListPath = parentListItemPath.slice(0, parentListItemPath.length - 1);
                const currentListLength = (currentList.children as any).length;
                if (currentListLength === 1) {
                  // If we have a single item,
                  // move the item out and disband the list
                  // Moving the node after the list atm, could also put it before if there is any reason
                  // Note that after removing the list, the position will be decremented
                  Transforms.moveNodes(editor, {
                    at: currentItemPath,
                    to: parentListPath.concat([parentListItemPath[parentListItemPath.length - 1] + 1])
                  });
                  Transforms.removeNodes(editor, {
                    at: currentListPath
                  });
                } else {
                  // Several items in list
                  //
                  // If current item is first, move it to outer list before
                  // If current item is last, just move it to outer list after
                  const currentIndex = currentItemPath[currentItemPath.length - 1];
                  if (currentIndex === 0) {
                    // Current item is first.
                    // Due to how sub lists are a child of the list item, we can not *just*
                    // move it to the outer list.
                    // Move after list's parent list item, then move
                    // the list itself into the previously moved item.
                    const newItemPath = parentListItemPath.slice(0, parentListItemPath.length - 1).concat([parentListItemPath[parentListItemPath.length - 1] + 1]);
                    Transforms.moveNodes(editor, {
                      at: currentItemPath,
                      to: newItemPath
                    });
                    Transforms.moveNodes(editor, {
                      at: currentListPath,
                      to: newItemPath.concat([1])
                    });
                  } else if (currentIndex === currentListLength - 1) {
                    // Current item is last, just move it to outer list after
                    Transforms.moveNodes(editor, {
                      at: currentItemPath,
                      to: parentListItemPath.slice(0, parentListItemPath.length - 1).concat([parentListItemPath[parentListItemPath.length - 1] + 1])
                    });
                  } else {
                    // Current item is in the middle, split the list and move item in between
                    // Splitting on the item after the current item, to then use the currentItemPath to move
                    // todo: A better strategy is possibly: move current to next parent list item index, create a list, and
                    // move each child after current into it. I added a small optimization to spilt_nodes, and it would
                    // be nice not to regress this
                    Transforms.splitNodes(editor, {
                      at: currentItemPath.slice(0, currentItemPath.length - 1).concat([currentItemPath[currentItemPath.length - 1] + 1])
                    });
                    // todo: Careful at this point concerning possibly normalizing the lists
                    // to combine adjecent same-level lists
                    // If a problem, consider other restructure strategy
                    const newCurrentItemPath = parentListItemPath.slice(0, parentListItemPath.length - 1).concat([parentListItemPath[parentListItemPath.length - 1] + 1]);
                    Transforms.moveNodes(editor, {
                      at: currentItemPath,
                      to: newCurrentItemPath
                    });
                    // Moving second part of the splitted list onto the moved item
                    Transforms.moveNodes(editor, {
                      at: currentItemPath.slice(0, currentItemPath.length - 2).concat([currentItemPath[currentItemPath.length - 2] + 1]),
                      to: newCurrentItemPath.concat([1])
                    });
                  }
                }
              }
            }
          }
          event.preventDefault();
          // Todo: Refactor to helper
          return;
        }
        // If we are inside a list_item already and it's previous item
        // is also a list_item, wrap it in a new list,
        // If no list, move the first non-text node into new list->list_item nodes
        const itemAbove = Editor.above(editor, {
          match: (n) => n.type === 'list_item'
        });
        if (itemAbove) {
          const [aboveNode, abovePath] = itemAbove;
          // Structure should be:
          // <ul>
          //   <li>First</li>
          //   <li>Second
          //     <ul>
          //       <li>Nested</li>
          //     </ul>
          //   </li>
          // </ul>
          // Could we use a simpler document structure, and just render
          // the html?
          if (abovePath[abovePath.length - 1] > 0) {
            const prevItemPath = abovePath.slice(0, abovePath.length - 1).concat([abovePath[abovePath.length - 1] - 1]);
            const prevItem = Node.get(editor, prevItemPath);
            if (prevItem.type === 'list_item') {
              // We need to check if there is a list inside this element.
              // Assuming at this point children[0] to be the item content, and
              // children[1] to possibly be a child list
              if (aboveNode.children.length > 1 && aboveNode.children[1].type === 'list') {
                // We have a child list inside this item.
                if ((prevItem.children as any).length > 1 && prevItem.children[1].type === 'list') {
                  // The previous item also has a list
                  // Move the list after prevItems list, then merge the two
                  const prevItemListNumItems = prevItem.children[1].children.length;
                  Transforms.moveNodes(editor, {
                    at: abovePath.concat([1]),
                    to: prevItemPath.concat([2])
                  });
                  Transforms.mergeNodes(editor, {
                    at: prevItemPath.concat([2])
                  });
                  Transforms.moveNodes(editor, {
                    at: abovePath,
                    to: prevItemPath.concat([1, prevItemListNumItems])
                  });
                } else {
                  // First move the list into prevItem instead, then
                  // move this the current item into the beginning of the list
                  Transforms.moveNodes(editor, {
                    at: abovePath.concat([1]),
                    to: prevItemPath.concat([1])
                  });
                  Transforms.moveNodes(editor, {
                    at: abovePath,
                    to: prevItemPath.concat([1, 0])
                  });
                }
              } else {
                // Does not contain a child list
                const prevItemLastIndex = (prevItem.children as any).length - 1;
                if (prevItem.children[prevItemLastIndex].type === 'list') {
                  // If previous item already has a list, just move into the end of this list
                  const insertAt = prevItemPath.concat([
                    prevItemLastIndex,
                    prevItem.children[prevItemLastIndex].children.length
                  ]);
                  Transforms.moveNodes(editor, {
                    at: abovePath,
                    to: insertAt
                  });
                } else {
                  // Add another list at the end of previous list_item
                  Transforms.insertNodes(editor, {
                    type: 'list',
                    children: []
                  }, {
                    at: prevItemPath.concat([1])
                  });
                  // And move the current list item into it
                  Transforms.moveNodes(editor, {
                    at: abovePath,
                    to: prevItemPath.concat([1, 0])
                  });
                }
              }
            }
          }
          // If the previous item was not a list item, consider indent request
          // as invalid
        } else {
          // Find first non-text node
          const [, nonTextPath] = Editor.above(editor, {
            match: (n) => !Text.isText(n)
          });
          const insertPath = nonTextPath.slice(0, nonTextPath.length - 1).concat([nonTextPath[nonTextPath.length - 1] + 1]);
          // Todo: If previous or next item is a list, move there, possibly merge
          Editor.withoutNormalizing(editor, () => {
            Transforms.insertNodes(editor, {
              type: 'list',
              children: [{
                type: 'list_item',
                children: []
              }]
            }, {
              at: insertPath
            });
            Transforms.moveNodes(editor, {
              at: nonTextPath,
              to: insertPath.concat([0, 0])
            });
          });
        }
        event.preventDefault();
      } else if (event.which === 13) {
        // If we are at the end of a list_item, add another list_item below.
        // todo: Refine. Inside elements like a table, one would expect an
        // added line there++
        const ancestors = Node.ancestors(editor, editor.selection.anchor.path, {
          reverse: true
        });
        for (const [node, path] of ancestors) {
          if (node.type === 'list_item') {
            const insertPath = path.slice(0, path.length - 1).concat([path[path.length - 1] + 1]);
            // list_items should probably contain text items directly, maybe a different container
            // than paragraph to contain the text nodes.
            Transforms.insertNodes(editor, {
              type: 'list_item',
              children: [{
                type: 'paragraph',
                children: [{ text: '' }]
              }]
            }, {
              at: insertPath
            });
            const selectionPath = insertPath.concat([0, 0]);
            Transforms.setSelection(editor, {
              anchor: { path: selectionPath, offset: 0 },
              focus: { path: selectionPath, offset: 0 }
            })
            event.preventDefault();
            break;
          }
        }
      }
    }
  }, []);

  return (
    <Slate editor={editor} value={value} onChange={onChange}>
      <Editable
        spellCheck={false}
        renderLeaf={renderLeaf}
        renderElement={renderElement}
        onKeyDown={onKeyDown} />
    </Slate>
  );
}

export default function DocPage() {
  const router = useRouter();
  console.log(router.query);

  const docKey = (router.query.user && router.query.doc) ? `${router.query.user}/${router.query.doc}` : null;
  const doc = useDoc(docKey);

  let inner;
  if (doc !== null) {
    inner = (
      <>
        <DocTitle doc={doc} />
        <Doc doc={doc} />
      </>
    );
  } else {
    inner = <div>...</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {inner}
      </main>
      <style jsx global>{`
      ul {
        border-top: 1px solid #eee;
      }
      `}</style>
    </div>
  );
}