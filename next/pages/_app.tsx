// import App from 'next/app'

import ConnectionCtx from '../components/ConnectionCtx';

import ReconnectingWebSocket from 'reconnecting-websocket';

import sharedb from 'sharedb/lib/client';

class Connection {
    connInner: null | any;

    constructor() {
        this.connInner = null;
    }

    async conn() {
        if (this.connInner !== null) {
            return Promise.resolve(this.connInner);
        }
        const socket = new ReconnectingWebSocket('ws://localhost:8080');
        this.connInner = new sharedb.Connection(socket);
        return Promise.resolve(this.connInner);
    }
}

const conn = new Connection();

function MyApp({ Component, pageProps }) {
    return (
        <ConnectionCtx.Provider value={conn}>
            <Component {...pageProps} />
        </ConnectionCtx.Provider>
    );
}

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.
//
// MyApp.getInitialProps = async (appContext) => {
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   return { ...appProps }
// }

export default MyApp