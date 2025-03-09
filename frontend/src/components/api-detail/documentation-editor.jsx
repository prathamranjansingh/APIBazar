// src/components/api-detail/documentation-editor.jsx
import { useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Bold, Italic, Link, List, ListOrdered, Heading1, Heading2, Code, Quote, Image, Divide } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DocumentationEditor({ content, onChange, setEditorRef }) {
  const editorRef = useRef(null)

  useEffect(() => {
    // Initialize the editor with content
    if (editorRef.current) {
      editorRef.current.innerHTML = content || ""
      // Pass the editor ref to parent if needed
      if (setEditorRef) {
        setEditorRef(editorRef.current)
      }
    }
  }, [content, setEditorRef])

  // Execute formatting command
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current.focus()
    // Notify about content change
    if (onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Insert code block
  const insertCodeBlock = () => {
    const selection = window.getSelection()
    const text = selection.toString()
    const codeBlock = `<pre class="bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm my-4">${text || 'Your code here'}</pre>`
    document.execCommand('insertHTML', false, codeBlock)
    editorRef.current.focus()
    if (onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Insert example request
  const insertRequestExample = () => {
    const template = `
<div class="border rounded-md p-4 my-4">
  <h3 class="text-base font-semibold mb-2">Example Request</h3>
  <pre class="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">
curl -X GET "https://api.example.com/endpoint" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-H "Content-Type: application/json"
  </pre>
</div>
`
    document.execCommand('insertHTML', false, template)
    editorRef.current.focus()
    if (onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Insert example response
  const insertResponseExample = () => {
    const template = `
<div class="border rounded-md p-4 my-4">
  <h3 class="text-base font-semibold mb-2">Example Response</h3>
  <pre class="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">
{
  "success": true,
  "data": {
    "id": 123,
    "name": "Example",
    "created": "2023-04-01T12:00:00Z"
  }
}
  </pre>
</div>
`
    document.execCommand('insertHTML', false, template)
    editorRef.current.focus()
    if (onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Insert a visual divider
  const insertDivider = () => {
    document.execCommand('insertHTML', false, '<hr class="my-6 border-t-2 border-muted">')
    editorRef.current.focus()
    if (onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="space-y-2">
      <Card className="p-1 border">
        <div className="bg-muted p-2 flex flex-wrap gap-1 border-b">
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt('Enter link URL:')
              if (url) execCommand('createLink', url)
            }}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('formatBlock', '<h2>')}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('formatBlock', '<h3>')}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertCodeBlock}>
            <Code className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand('formatBlock', '<blockquote>')}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertDivider}>
            <Divide className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt('Enter image URL:')
              if (url) execCommand('insertImage', url)
            }}
          >
            <Image className="h-4 w-4" />
          </Button>
          <div className="h-4 border-r mx-1"></div>
          <Button type="button" variant="ghost" size="sm" onClick={insertRequestExample}>
            Request Example
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertResponseExample}>
            Response Example
          </Button>
        </div>
        <div
          ref={editorRef}
          className="min-h-[300px] p-4 prose prose-sm max-w-none focus:outline-none"
          contentEditable
          onBlur={() => {
            if (onChange && editorRef.current) {
              onChange(editorRef.current.innerHTML)
            }
          }}
        />
      </Card>
      <div className="text-sm text-muted-foreground">
        <p>Pro tips: Use the toolbar to format your documentation. Add code examples, links, and sections to make your documentation more helpful.</p>
      </div>
    </div>
  )
}