import Script from '../lib/script/Scripts';
import { useMemo, useRef, useEffect } from 'react';

const source = `
const x: number = 1;
console.log("Testing", x);
`;

export default function CodeEditor(props) {
  const script = useRef<Script>();
  useEffect(() => {
    script.current = new Script(source);
    return () => {
      script.current.terminate();
    };
  }, []);
  return (
    <div className="code-editor" {...props.attributes}>
      {props.children}
    </div>
  );
}