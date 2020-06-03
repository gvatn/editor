// import App from 'next/app'

import ConnectionCtx, { Connection } from '../components/ConnectionCtx';

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