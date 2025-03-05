"use client"

import { useState } from "react"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Check, Copy } from "lucide-react"

// Code language options
const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "jsx", label: "JSX" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
]

function CodeEditorModal({ isOpen, onClose, onInsert, codeSnippet, setCodeSnippet, codeLanguage, setCodeLanguage }) {
  const [isCopied, setIsCopied] = useState(false)

  if (!isOpen) return null

  const copyToClipboard = () => {
    if (codeSnippet) {
      navigator.clipboard.writeText(codeSnippet)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium font-bricolage">Insert Code Snippet</h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="codeLanguage">Language</Label>
            <select
              id="codeLanguage"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded-md relative">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 w-8 p-0"
                aria-label={isCopied ? "Copied" : "Copy to clipboard"}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Editor
              value={codeSnippet}
              onValueChange={(code) => setCodeSnippet(code)}
              highlight={(code) => highlight(code, languages[codeLanguage] || languages.javascript, codeLanguage)}
              padding={15}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                minHeight: "200px",
              }}
              className="editor-container"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onInsert(codeSnippet)}>Insert Code</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditorModal

