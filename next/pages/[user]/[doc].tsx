import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect } from 'react';
import ConnectionCtx, { useConn, useDoc } from '../../components/ConnectionCtx';

function Doc({doc}) {
  console.log("Got doc", doc);
  return <div>Doc</div>;
}

export default function DocPage() {
  const router = useRouter();
  console.log(router.query);

  const docKey = (router.query.user && router.query.doc) ? `${router.query.user}/${router.query.doc}` : null;
  const doc = useDoc(docKey);

  let inner;
  if (doc !== null) {
    inner = <Doc doc={doc}/>;
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