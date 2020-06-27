import Script from '../lib/script/Scripts';
import { useMemo, useRef, useEffect, useState } from 'react';
import { Node, Text } from 'slate';

const source = `
const x: number = 1;
console.log("Testing", x);
`;

function stringLines(node: Node) {
  if (Text.isText(node)) {
    return node.text;
  } else {
    return node.children.map(stringLines).join('\n');
  }
}

export function CodeLine(props) {
  return (
    <div {...props.attributes}>
      {props.children}
    </div>
  );
}

export function CodeEditor(props) {
  const script = useRef<Script>();
  const [transpiled, setTranspiled] = useState('');
  useEffect(() => {
    script.current = new Script(source, (transpiled) => setTranspiled(transpiled));
    return () => {
      script.current.terminate();
    };
  }, []);
  const string = stringLines(props.element);
  console.log("String", string);
  if (script.current) {
    script.current.updateScript(string);
  } else {
    console.log("Script uninitialized");
  }
  return (
    <div className="code-editor" {...props.attributes}>
      {props.children}
      <div className="code-transpiled">{transpiled}</div>
    </div>
  );
}