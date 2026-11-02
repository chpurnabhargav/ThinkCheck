import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// PrismLight + explicit languages keeps the bundle small (the full Prism build
// ships every language).
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

const languages = {
  bash, sh: bash, shell: bash, c, cpp, 'c++': cpp, csharp, cs: csharp, css, go, java,
  javascript, js: javascript, json, jsx, kotlin, html: markup, xml: markup, markup, php,
  python, py: python, ruby, rust, sql, tsx, typescript, ts: typescript, yaml, yml: yaml,
};
Object.entries(languages).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const components = {
  // The highlighter renders its own <pre>, so drop the wrapper react-markdown adds.
  pre: ({ children }) => <>{children}</>,
  code({ node, className, children, ...props }) {
    const language = /language-([\w+#-]+)/.exec(className || '')?.[1]?.toLowerCase();
    // react-markdown v10 has no `inline` prop: fenced blocks span several source lines.
    const isBlock = Boolean(language) || node?.position?.start.line !== node?.position?.end.line;

    if (!isBlock) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-900 dark-code text-[0.9em]" {...props}>
          {children}
        </code>
      );
    }
    return (
      <SyntaxHighlighter
        language={language && languages[language] ? language : 'text'}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{ margin: '1rem 0', borderRadius: '0.5rem', fontSize: '0.875rem' }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  },
};

export default function Markdown({ children, dark = false, className = '' }) {
  return (
    <div
      className={`prose max-w-none prose-code:before:content-none prose-code:after:content-none ${
        dark ? 'prose-invert [&_.dark-code]:bg-gray-700 [&_.dark-code]:text-gray-100' : ''
      } ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
