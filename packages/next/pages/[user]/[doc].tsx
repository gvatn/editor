import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor, Node, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react'

import { json1 } from 'ot-slate';

const jsonTextPath = (path) => {
  let p = [path[0]];
  for (let i = 1; i < path.length; i++) {
    p.push('children', path[i]);
  }
  p.push('text');
  return p;
};

// Path to text's parent children array
const textChildrenPath = (path) => {
  let p = [path[0]];
  for (let i = 1; i < path.length; i++) {
    if (i === path.length - 1) {
      p.push('children');
    } else {
      p.push('children', path[i]);
    }
  }
  return p;
};

// Entry path inside a children array
const entryPath = (path) => {
  let p = [];
  for (let i = 0; i < path.length; i++) {
    if (i === path.length - 1) {
      p.push(path[i]);
    } else {
      p.push(path[i], 'children');
    }
  }
  return p;
};

// Children array of the given path
const childrenPath = (path) => {
  let p = [];
  for (let i = 0; i < path.length; i++) {
    p.push(path[i], 'children');
  }
  return p;
};

const withCustom = (doc, editor) => {
  const { apply } = editor;
  editor.apply = (op: any) => {
    console.log("Op", op);
    if (op.type !== "set_selection") {
      let shareOps = [];
      if (op.type === "insert_text") {
        shareOps.push(json1.editOp(jsonTextPath(op.path), 'text-unicode', [op.offset, op.text]));
      } else if (op.type === "remove_text") {
        shareOps.push(json1.editOp(jsonTextPath(op.path), 'text-unicode', [op.offset, {d: op.text.length}]));
      } else if (op.type === "split_node") {
        // Determine type
        const node = Node.get(editor, op.path);
        console.log("Node", node);
        if (Text.isText(node)) {
          // In the case of text, split the text
          const textNext = node.text.substring(op.position);
          const parentNode = Node.parent(editor, op.path);
          console.log("Text next", textNext, parentNode);
          const nextTextPath = textChildrenPath(op.path).concat([op.path[op.path.length - 1] + 1]);
          console.log("Next text path", nextTextPath);
          shareOps.push(
            json1.editOp(jsonTextPath(op.path), 'text-unicode', [op.position, {d: textNext.length}]),
            json1.insertOp(nextTextPath, {text: textNext})
          );
        } else {
          // Else split in the child components
          const toInsertNode = {
            ...op.properties,
            children: []
          };
          const baseChildren = childrenPath(op.path);
          const fromNode = baseChildren.concat([op.position]);
          const toBase = baseChildren.slice(0, baseChildren.length - 2).concat([op.path[op.path.length - 1] + 1]);
          const toNode = toBase.concat(['children', 0]);
          // todo: Not sure if 'target' property needs to be handled
          shareOps.push(
            json1.insertOp(toBase, toInsertNode),
            json1.moveOp(fromNode, toNode)
          );
          //console.log("From to", fromNode, toNode);
        }
      } else if (op.type === 'merge_node') {
        // Determine type
        const node = Node.get(editor, op.path);
        console.log("Node", node);
        if (Text.isText(node)) {
          // In the case of text, assuming previous child is another text node,
          // append this text
          const fromBase = childrenPath(op.path.slice(0, op.path.length - 1));
          const rmPath = fromBase.concat([op.path[op.path.length - 1]]);
          const appendAtPath = fromBase.concat([op.path[op.path.length - 1] - 1, 'text']);
          shareOps.push(
            json1.removeOp(rmPath),
            json1.editOp(appendAtPath, 'text-unicode', [op.position, node.text])
          );
        } else {
          // Merge children of this node with the previous node's children from
          // the given position
          const fromBase = childrenPath(op.path);
          const toBase = fromBase.slice(0, fromBase.length - 2).concat([op.path[op.path.length - 1] - 1, 'children']);
          for (let childIndex = 0; childIndex < node.children.length; childIndex++) {
            shareOps.push(json1.moveOp(fromBase.concat([childIndex]), toBase.concat(op.position + childIndex)));
          }
          shareOps.push(json1.removeOp(fromBase.slice(0, fromBase.length - 1)));
        }
      }
      if (shareOps.length > 0) {
        for (const shareOp of shareOps) {
          console.log("Submitting", shareOp);
          doc.submitOp(shareOp);
        }
      }
    }
    apply(op);
        console.log("json", JSON.parse(JSON.stringify(editor.children)));
  };
  return editor;
};

function Doc({ doc }) {
  console.log("Got doc", doc);
  const editor = useMemo(() => withCustom(doc, withReact(createEditor())), []);
  const [value, setValue] = useState<any>(doc.data);
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
    console.log(newValue);
    setValue(newValue);
  }, []);

  return (<div className="slate-test">
    <Slate editor={editor} value={value} onChange={onChange}>
      <Editable spellCheck={false} />
    </Slate>
  </div>);
}

export default function DocPage() {
  const router = useRouter();
  console.log(router.query);

  const docKey = (router.query.user && router.query.doc) ? `${router.query.user}/${router.query.doc}` : null;
  const doc = useDoc(docKey);

  let inner;
  if (doc !== null) {
    inner = <Doc doc={doc} />;
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
    </div>
  );
}