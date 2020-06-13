import * as http from 'http';
import * as express from 'express';
import * as WebSocket from 'ws';
import * as WebSocketJSONStream from '@teamwork/websocket-json-stream';
import * as ShareDB from 'sharedb';
import * as ShareDBMongo from 'sharedb-mongo';
import * as OtSlate from 'ot-slate';

console.log("Ot slate", OtSlate);

ShareDB.types.register(OtSlate.type);

const db = ShareDBMongo('mongodb://docsUser:123@localhost:27017/docs', {
    useUnifiedTopology: true
});

const backend = new ShareDB({
    db: db
});

function startServer() {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({server: server});
    wss.on('connection', (ws: any) => {
        const stream = new WebSocketJSONStream(ws);
        backend.listen(stream);
    });

    server.listen(8080);
    console.log("Listening on 8080");
}

startServer();