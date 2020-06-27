
class Script {
    public worker: Worker;

    constructor(public script: string, public onTranspile: (transpiled: string) => void) {
        this.worker = new Worker('./ts.worker.ts', { type: 'module' });
        // Todo: removeEventListener?
        this.worker.addEventListener('message', (msg) => this.onMessage(msg));
        this.worker.postMessage('from Host')
    }

    onMessage(msg) {
        switch (msg.data.type) {
            case 'transpiled':
                this.onTranspile(msg.data.transpiled);
                break;
        }
    }

    // Todo: "Incremental" way to update the script content based
    // on editor or sharedb ops
    // Rope data structure?
    updateScript(script) {
        this.worker.postMessage({
            type: 'updateScript',
            script: script
        });
    }

    terminate() {
        this.worker.terminate();
    }
}

export default Script;