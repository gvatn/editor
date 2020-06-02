import { createContext, useState, useContext } from 'react';


const ConnectionCtx = createContext(null);

export default ConnectionCtx;

function useConn() {
    const connContext = useContext(ConnectionCtx) as any;
    const [conn, setConn] = useState(connContext.connInner);
    let requireConn = () => {
        console.log("Conn is", conn)
        if (conn !== null) {
            return;
        }
        connContext.conn().then(conn => {
            console.log("Setting");
            setConn(conn);
        });
    };
    return [conn, requireConn];
}

function useDoc(key) {
    const [doc, setDoc] = useState(null);
    const [conn, requireConn] = useConn();
    if (doc !== null) {
        return doc;
    }
    requireConn();
    if (conn === null) {
        return doc;
    }
    // Treat null key as "key not ready"
    if (key === null) {
        return doc;
    }
    const rawDoc = conn.get('docs', key);
    console.log("Got raw doc", rawDoc);
    if (rawDoc.type === null) {
        rawDoc.create({ items: [] }, function () {
            console.log("Creating");
            setDoc(rawDoc);
        });
    } else {
        console.log("Already created");
        setDoc(rawDoc);
    }
    return doc;
}

export { useConn, useDoc };