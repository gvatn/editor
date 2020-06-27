import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor, Node, Text, Transforms, Editor, Operation } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import SlateAdaptor from '../../lib/SlateAdaptor';
import { Transform } from 'stream';
import { unindent, indent, attemptAddItem } from '../../lib/editor/List';

import {CodeEditor, CodeLine} from '../../components/CodeEditor';

const withCustom = (prefix, doc, editor) => {
  const { apply, isElement } = editor;
  const adapter = new SlateAdaptor(editor, doc, prefix);
  editor.apply = (op: any) => {
    adapter.handle(op);
    apply(op);
  };
  editor.isElement = (n: any) => {
    return n.type === 'list' || n.type === 'list_item';
  };
  editor.free = () => {
    adapter.free();
  };
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
    case 'code':
      return <CodeEditor {...props} />;
    case 'code-line':
      return <CodeLine {...props} />;
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
  const editor = useMemo<ReactEditor & { free: () => void }>(() => withCustom("doc", doc, withReact(createEditor())), []);
  const [value, setValue] = useState<any>(doc.data.doc);
  useEffect(() => {
    return () => {
      editor.free();
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
            type: 'code',
            children: [{
              type: 'code-line',
              children: [{
                text: ''
              }]
            }]
          });
          break;
        }
      }
    } else {
      if (event.which === 9) {
        // Tab
        if (event.shiftKey) {
          unindent(editor);
        } else {
          indent(editor);
        }
      } else if (event.which === 13) {
        attemptAddItem(editor);
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
      .code-editor {
        padding: 0.4rem;
        background: #fafafa;
        color: #555;
        font-family: monospace, monospace;
        font-size: 0.8rem;
      }
      .code-transpiled {
        background: #fafffa;
      }
      `}</style>
    </div>
  );
}