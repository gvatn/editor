import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor, Node, Text, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react'
import SlateAdapter from '../../components/SlateAdapter';



const withCustom = (prefix, doc, editor) => {
  const { apply } = editor;
  const adapter = new SlateAdapter(editor, doc, prefix);
  editor.apply = (op: any) => {
    adapter.handle(op);
    apply(op);
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

function renderElement(props) {
  switch (props.element.type) {
    case 'paragraph':
      return <DefaultElement {...props} />;
    case 'block':
      return <Block {...props} />;
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
    </div>
  );
}