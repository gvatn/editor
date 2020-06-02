import { createContext, useState, useContext } from 'react';


const ConnectionCtx = createContext(null);

export default ConnectionCtx;

function useConn() {
  const [conn, setConn] = useState(null);
  const connContext = useContext(ConnectionCtx) as any;
  let requireConn = () => {
    if (conn !== null) {
        return;
    }
    connContext.conn().then(conn => setConn(conn));
  };
  return [conn, requireConn];
}

export { useConn };