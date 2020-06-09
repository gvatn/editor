import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react'

import { json1 } from 'ot-slate';

const jsonPath = (path) => {
  let p = [path[0]];
  for (let i = 1; i < path.length; i++) {
    p.push('children', path[i]);
  }
  p.push('text');
  return p;
};

const withCustom = (doc, editor) => {
  const { apply } = editor;
  editor.apply = (op: any) => {
    console.log("Op", op);
    if (op.type !== "set_selection") {
      let shareOp;
      if (op.type === "remove_text") {
        shareOp = json1.editOp(jsonPath(op.path), 'text-unicode', [op.offset, {d: op.text.length}]);
      }
      if (shareOp) {
        doc.submitOp(shareOp);
      }
    }
    apply(op);
  };
  return editor;
};

function Doc({ doc }) {
  console.log("Got doc", doc);
  const editor = useMemo(() => withCustom(doc, withReact(createEditor())), []);
  const [value, setValue] = useState<any>(doc.data);

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