import Head from 'next/head'

import { useRouter } from 'next/router';
import { useContext, useState, useEffect } from 'react';
import ConnectionCtx, { useConn } from '../../components/ConnectionCtx';

export default function Doc() {
  const router = useRouter();
  console.log(router.query);

  const [conn, requireConn] = useConn();
  requireConn();

  console.log("Conn", conn);

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        Test
      </main>
    </div>
  );
}