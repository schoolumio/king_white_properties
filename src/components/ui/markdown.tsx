import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Safe Markdown renderer for CMS content (raw HTML is not rendered). */
export function Markdown({ children, className, invert }: { children?: string | null; className?: string; invert?: boolean }) {
  if (!children) return null;
  return (
    <div className={cn("prose-corporate", invert && "prose-invert", className)}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          img: () => null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
