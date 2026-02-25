import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material/styles';
import { CODE_BLOCK_BORDER_RADIUS, CODE_FONT_SIZE } from '../../constants';

const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeSanitize];

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const markdownComponents = useMemo<Components>(
    () => ({
      code(props) {
        const { children, className, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const inline = !match;
        return !inline ? (
          <SyntaxHighlighter
            style={isDark ? oneDark : oneLight}
            language={match[1]}
            PreTag="div"
            customStyle={{
              borderRadius: CODE_BLOCK_BORDER_RADIUS,
              fontSize: CODE_FONT_SIZE,
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...rest}>
            {children}
          </code>
        );
      },
    }),
    [isDark],
  );

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
