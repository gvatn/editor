import ts from 'typescript';

declare var self: DedicatedWorkerGlobalScope;
export { };

const source = `
const x: number = 1;
console.log("Testing", x);
`;

class ScriptSnapshot implements ts.IScriptSnapshot {
  constructor(public source: string) { }
  getText(start: number, end: number): string {
    return this.source.substring(start, end);
  }
  getLength(): number {
    return this.source.length;
  }
  getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
    throw new Error("Method not implemented.");
  }
  dispose?(): void {
  }
}

class LangHost implements ts.LanguageServiceHost {
  getCompilationSettings(): ts.CompilerOptions {
    return {};
  }
  getNewLine?(): string {
    throw new Error("Method not implemented.");
  }
  getProjectVersion?(): string {
    return '0.0.1';
  }
  getScriptFileNames(): string[] {
    return ['/src/index.ts'];
  }
  getScriptKind?(fileName: string): ts.ScriptKind {
    if (fileName === '/src/index.ts') {
      return ts.ScriptKind.TS;
    }
    throw new Error("Method not implemented.");
  }
  getScriptVersion(fileName: string): string {
    if (fileName === '/src/index.ts') {
      return '0.0.1';
    }
    throw new Error("Method not implemented.");
  }
  getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
    if (fileName === '/src/index.ts') {
      const snapshot = new ScriptSnapshot(source);
      return snapshot;
    } else {
      debugger;
    }
  }
  getProjectReferences?(): readonly ts.ProjectReference[] {
    return [];
  }
  getLocalizedDiagnosticMessages?() {
    // todo: Only says returns any
    return [];
  }
  getCancellationToken?(): ts.HostCancellationToken {
    const t = {
      isCancellationRequested: () => false
    };
    return t;
  }
  getCurrentDirectory(): string {
    return '/src';
  }
  getDefaultLibFileName(options: ts.CompilerOptions): string {
    return 'index.ts';
  }
  log?(s: string): void {
    console.log("Ts-log", s);
  }
  trace?(s: string): void {
    throw new Error("Method not implemented.");
  }
  error?(s: string): void {
    throw new Error("Method not implemented.");
  }
  useCaseSensitiveFileNames?(): boolean {
    return true;
  }
  readDirectory?(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[] {
    throw new Error("Method not implemented.");
  }
  readFile?(path: string, encoding?: string): string {
    throw new Error("Method not implemented.");
  }
  realpath?(path: string): string {
    throw new Error("Method not implemented.");
  }
  fileExists?(path: string): boolean {
    if (path === '/src/package.json') {
      return false;
    } else {
      debugger;
    }
    throw new Error("Method not implemented.");
  }
  getTypeRootsVersion?(): number {
    return 1;
  }
  resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[], redirectedReference: ts.ResolvedProjectReference, options: ts.CompilerOptions): ts.ResolvedModule[] {
    throw new Error("Method not implemented.");
  }
  getResolvedModuleWithFailedLookupLocationsFromCache?(modulename: string, containingFile: string): ts.ResolvedModuleWithFailedLookupLocations {
    throw new Error("Method not implemented.");
  }
  resolveTypeReferenceDirectives?(typeDirectiveNames: string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference, options: ts.CompilerOptions): ts.ResolvedTypeReferenceDirective[] {
    return [];
  }
  getDirectories?(directoryName: string): string[] {
    return ["/src"];
  }
  getCustomTransformers?(): ts.CustomTransformers {
    throw new Error("Method not implemented.");
  }
  isKnownTypesPackageName?(name: string): boolean {
    throw new Error("Method not implemented.");
  }
  installPackage?(options: ts.InstallPackageOptions): Promise<ts.ApplyCodeActionCommandResult> {
    throw new Error("Method not implemented.");
  }
  writeFile?(fileName: string, content: string): void {
    throw new Error("Method not implemented.");
  }
  directoryExists?(directoryName: string): boolean {
    if (directoryName === "/src/node_modules/@types") {
      return true;
    } else if (directoryName === "/node_modules/@types") {
      return true;
    } else {
      debugger;
    }
    throw new Error("Method not implemented.");
  }
}

const langHost = new LangHost();

const langService = ts.createLanguageService(langHost);

const program = langService.getProgram();
console.log("Program", program);

function transpileScript(source) {
  const t0 = performance.now();
  const transpiled = ts.transpile(source);
  console.log("Ms", performance.now() - t0);
  console.log("Transpiled", transpiled);
  postMessage({
    type: 'transpiled',
    transpiled: transpiled
  });
}

function handleMessage(msg) {
  console.log('Worker received:', msg);
  switch (msg.data.type) {
    case 'updateScript':
      transpileScript(msg.data.script);
      break;
  }
}

addEventListener('message', handleMessage);