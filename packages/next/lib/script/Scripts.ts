
class Script {
    public worker: Worker;

    constructor(public script: string) {
        this.worker = new Worker('./ts.worker.ts', {type: 'module'});
        this.worker.addEventListener('message', (m) => console.log(m));
        this.worker.postMessage('from Host')
    }

    terminate() {
        this.worker.terminate();
    }
}

export default Script;