import "katex/dist/katex.min.css";
import { Fragment, useMemo } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { CodeBlock } from "@web-speed-hackathon-2026/client/src/components/crok/CodeBlock";
import { TypingIndicator } from "@web-speed-hackathon-2026/client/src/components/crok/TypingIndicator";
import { CrokLogo } from "@web-speed-hackathon-2026/client/src/components/foundation/CrokLogo";

interface Props {
  message: Models.ChatMessage;
  isLastStreaming?: boolean;
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

const StreamingText = ({ content }: { content: string }) => {
  const elements = useMemo(() => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      const match = HEADING_RE.exec(line);
      if (match) {
        const level = match[1]!.length;
        const text = match[2]!;
        switch (level) {
          case 1:
            return <h1 key={i}>{text}</h1>;
          case 2:
            return <h2 key={i}>{text}</h2>;
          case 3:
            return <h3 key={i}>{text}</h3>;
          case 4:
            return <h4 key={i}>{text}</h4>;
          case 5:
            return <h5 key={i}>{text}</h5>;
          default:
            return <h6 key={i}>{text}</h6>;
        }
      }
      return (
        <Fragment key={i}>
          {line}
          {i < lines.length - 1 ? "\n" : null}
        </Fragment>
      );
    });
  }, [content]);

  return <div className="whitespace-pre-wrap">{elements}</div>;
};

const UserMessage = ({ content }: { content: string }) => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="bg-cax-surface-subtle text-cax-text max-w-[80%] rounded-3xl px-4 py-2">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

const AssistantMessage = ({
  content,
  isLastStreaming,
}: {
  content: string;
  isLastStreaming: boolean;
}) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="h-8 w-8 shrink-0">
        <CrokLogo className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-cax-text mb-1 text-sm font-medium">Crok</div>
        <div className="markdown text-cax-text max-w-none">
          {content ? (
            isLastStreaming ? (
              <StreamingText content={content} />
            ) : (
              <Markdown
                components={{ pre: CodeBlock }}
                rehypePlugins={[rehypeKatex]}
                remarkPlugins={[remarkMath, remarkGfm]}
              >
                {content}
              </Markdown>
            )
          ) : (
            <TypingIndicator />
          )}
        </div>
      </div>
    </div>
  );
};

export const ChatMessage = ({ message, isLastStreaming }: Props) => {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }
  return <AssistantMessage content={message.content} isLastStreaming={isLastStreaming === true} />;
};
