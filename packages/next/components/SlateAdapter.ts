import { json1 } from 'ot-slate';
import { Node, Text } from 'slate';

type sharePath = (string | number)[];

/**
 * Transforms slate ops to sharedb ops
 */
export default class SlateAdapter {
  constructor(public editor, public doc, public prefix) { }

  handle(op) {
    console.log("Op", op);
    if (op.type !== "set_selection") {
      let shareOps = [];
      if (op.type === "insert_text") {
        this.insertText(op, shareOps);
      } else if (op.type === "remove_text") {
        this.removeText(op, shareOps);
      } else if (op.type === "split_node") {
        this.splitNode(op, shareOps);
      } else if (op.type === 'merge_node') {
        this.mergeNode(op, shareOps);
      } else if (op.type === 'set_node') {
        this.setNode(op, shareOps);
      } else if (op.type === 'insert_node') {
        this.insertNode(op, shareOps);
      }
      if (shareOps.length > 0) {
        for (const shareOp of shareOps) {
          if (typeof this.doc.data === 'undefined') {
            debugger;
          }
          const docData = JSON.parse(JSON.stringify(this.doc.data));
          console.log("Submitting", shareOp, docData);
          this.doc.submitOp(shareOp);
        }
      }
    }
  }

  insertText(op, shareOps) {
    shareOps.push(json1.editOp(this.jsonTextPath(op.path), 'text-unicode', [op.offset, op.text]));
  }

  removeText(op, shareOps) {
    shareOps.push(json1.editOp(this.jsonTextPath(op.path), 'text-unicode', [op.offset, { d: op.text.length }]));
  }

  insertNode(op, shareOps) {
    const newNode = this.entryPath(op.path);
    shareOps.push(json1.insertOp(newNode, op.node));
  }

  setNode(op, shareOps) {
    const shareNode = this.entryPath(op.path);
    for (const prop in op.newProperties) {
      if (op.properties[prop] === undefined) {
        shareOps.push(json1.insertOp(shareNode.concat([prop]), op.newProperties[prop]));
      } else {
        shareOps.push(json1.replaceOp(shareNode.concat([prop]), op.properties[prop], op.newProperties[prop]));
      }
    }
  }

  splitNode(op, shareOps) {
    // Determine type
    const node = Node.get(this.editor, op.path);
    if (Text.isText(node)) {
      // In the case of text, split the text
      const textNext = node.text.substring(op.position);
      const nextTextPath = this.textChildrenPath(op.path).concat([op.path[op.path.length - 1] + 1]);
      shareOps.push(
        json1.editOp(this.jsonTextPath(op.path), 'text-unicode', [op.position, { d: textNext.length }]),
        json1.insertOp(nextTextPath, { text: textNext })
      );
      return;
    } else {
      // Else split in the child components
      const toInsertNode = {
        ...op.properties,
        children: []
      };
      const baseChildren = this.childrenPath(op.path);
      const fromNode = baseChildren.concat([op.position]);
      const toBase = baseChildren.slice(0, baseChildren.length - 2).concat([op.path[op.path.length - 1] + 1]);
      const toNode = toBase.concat(['children', 0]);
      // todo: Not sure if 'target' property needs to be handled
      shareOps.push(
        json1.insertOp(toBase, toInsertNode),
        json1.moveOp(fromNode, toNode)
      );
      return;
      //console.log("From to", fromNode, toNode);
    }
  }

  mergeNode(op, shareOps) {
    // Determine type
    const node = Node.get(this.editor, op.path);
    if (Text.isText(node)) {
      // In the case of text, assuming previous child is another text node,
      // append this text
      const fromBase = this.childrenPath(op.path.slice(0, op.path.length - 1));
      const rmPath = fromBase.concat([op.path[op.path.length - 1]]);
      const appendAtPath = fromBase.concat([op.path[op.path.length - 1] - 1, 'text']);
      shareOps.push(
        json1.removeOp(rmPath),
        json1.editOp(appendAtPath, 'text-unicode', [op.position, node.text])
      );
      return;
    } else {
      // Merge children of this node with the previous node's children from
      // the given position
      const fromBase = this.childrenPath(op.path);
      const toBase = fromBase.slice(0, fromBase.length - 2).concat([op.path[op.path.length - 1] - 1, 'children']);

      // todo: Figure out why the next line causes doc.data to be undefined on next op
      //let shareOps = [];

      for (let childIndex = 0; childIndex < node.children.length; childIndex++) {
        shareOps.push(json1.moveOp(fromBase.concat([childIndex]), toBase.concat(op.position + childIndex)));
      }
      shareOps.push(json1.removeOp(fromBase.slice(0, fromBase.length - 1)));
      return;
    }
  }

  jsonTextPath(path: number[]): sharePath {
    let p = [this.prefix, path[0]];
    for (let i = 1; i < path.length; i++) {
      p.push('children', path[i]);
    }
    p.push('text');
    return p;
  };

  // Path to text's parent children array
  textChildrenPath(path: number[]): sharePath {
    let p = [this.prefix, path[0]];
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
  entryPath(path: number[]): sharePath {
    let p: sharePath = [this.prefix];
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
  childrenPath(path: number[]): sharePath {
    let p: sharePath = [this.prefix];
    for (let i = 0; i < path.length; i++) {
      p.push(path[i], 'children');
    }
    return p;
  };
}