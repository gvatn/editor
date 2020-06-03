import { createContext, useState, useContext } from 'react';

import ReconnectingWebSocket from 'reconnecting-websocket';

import sharedb from 'sharedb/lib/client';


class Connection {
    connInner: null | any;

    isConnecting: boolean

    constructor() {
        this.connInner = null;
        this.isConnecting = false;
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

const ConnectionCtx = createContext(null);

export default ConnectionCtx;

function useConn() {
    const connContext = useContext(ConnectionCtx) as Connection;
    const [conn, setConn] = useState(connContext.connInner);
    let requireConn = () => {
        console.log("Conn is", conn)
        if (conn !== null) {
            return;
        }
        if (connContext.isConnecting) {
            return;
        }
        connContext.isConnecting = true;
        connContext.conn().then(conn => {
            console.log("Setting");
            setConn(conn);
        });
    };
    return [conn, requireConn];
}

function useDoc(key) {
    const [doc, setDoc] = useState(null);
    // While possibly creating the initial document,
    // we just hold onto the instance here, and only update
    // the above doc state when document is ready
    // Being contained in an object, changes should not
    // trigger render
    const [localDoc, setLocalDoc] = useState({
        instance: null
    });
    const [conn, requireConn] = useConn();
    if (doc !== null) {
        return doc;
    }
    requireConn();
    // Treat null key as "key not ready"
    if (conn === null || key === null || localDoc.instance !== null) {
        return doc;
    }
    localDoc.instance = conn.get('docs', key);
    console.log("Got instance", localDoc.instance);
    setLocalDoc(localDoc); // Not sure if this is necessary
    localDoc.instance.fetch((err) => {
        if (err) {
            console.error(err);
            return doc;
        }
        console.log("Fetched", localDoc.instance);
        if (localDoc.instance.type === null) {
            debugger;
            localDoc.instance.create({ items: [] }, function () {
                console.log("Created doc");
                setDoc(localDoc.instance);
            });
        } else {
            console.log("Already created");
            setDoc(localDoc.instance);
        }
    });
    return doc;
}

export { useConn, useDoc, Connection };