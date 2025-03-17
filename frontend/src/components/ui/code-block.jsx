import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export const CodeBlock = ({
  children,
  language = "javascript",
  showLineNumbers = true,
  showCopyButton = true,
  className = ""
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted && resolvedTheme === "dark";

  const copyToClipboard = async () => {
    if (typeof children === "string") {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    }
  };

  return (
    <div className={`relative rounded-md ${className}`}>
      {showCopyButton && typeof children === "string" && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100 z-10"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      <SyntaxHighlighter
        language={language}
        style={isDarkTheme ? oneDark : oneLight}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.9rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};