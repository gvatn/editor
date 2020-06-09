import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react'

const withCustom = (editor) => {
  const { apply } = editor;
  editor.apply = (op) => {
    console.log("Op", op);
    apply(op);
  };
  return editor;
};

function Doc({ doc }) {
  console.log("Got doc", doc);
  const editor = useMemo(() => withCustom(withReact(createEditor())), []);
  const [value, setValue] = useState<any>([
    {
      type: 'paragraph',
      children: [{ text: 'A line of text in a paragraph.' }],
    }
  ]);

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