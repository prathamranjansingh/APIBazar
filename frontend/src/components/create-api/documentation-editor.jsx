import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Code,
  Heading1,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Pilcrow,
  FileCode,
  ChevronDown,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import CodeEditorModal from "./code-editor-modal"
import useEditorSelection from "../../hooks/use-editor-selection"

function DocumentationEditor({ formData, updateFormData, setEditorRef }) {
  const editorRef = useRef(null)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState("// Enter your code here")
  const [codeLanguage, setCodeLanguage] = useState("javascript")
  const [previewMode, setPreviewMode] = useState(false)
  const [currentSelection, setCurrentSelection] = useState(null)

  // Set the editor ref for the parent component
  useEffect(() => {
    if (editorRef.current) {
      setEditorRef(editorRef.current)
    }
  }, [setEditorRef])

  // Save current selection
  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection()
      if (sel.getRangeAt && sel.rangeCount) {
        setCurrentSelection(sel.getRangeAt(0))
      }
    }
  }

  // Restore saved selection
  const restoreSelection = () => {
    if (currentSelection) {
      if (window.getSelection) {
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(currentSelection)
      }
    }
  }

  // Initialize editor content
  useEffect(() => {
    if (!formData.documentation && editorRef.current) {
      const initialContent = generateInitialDocumentation(formData.name)
      updateFormData({ documentation: initialContent })

      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent
      }
    } else if (formData.documentation && editorRef.current) {
      // Update the editor with the current documentation
      editorRef.current.innerHTML = formData.documentation
    }
  }, [formData.name])

  // Handle paste events to strip formatting
  useEffect(() => {
    const editor = editorRef.current
    if (editor) {
      const handlePaste = (e) => {
        e.preventDefault()
        const text = e.clipboardData?.getData("text/plain") || ""
        
        // Use the proper way to insert text
        if (window.getSelection) {
          const selection = window.getSelection()
          if (selection.getRangeAt && selection.rangeCount) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            const textNode = document.createTextNode(text)
            range.insertNode(textNode)
            
            // Move the cursor to the end of the inserted text
            range.setStartAfter(textNode)
            range.setEndAfter(textNode)
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
        
        // Update form data
        updateFormData({ documentation: editor.innerHTML })
      }

      editor.addEventListener("paste", handlePaste)
      return () => {
        editor.removeEventListener("paste", handlePaste)
      }
    }
  }, [updateFormData])

  // Generate initial documentation template based on API name
  const generateInitialDocumentation = (apiName) => {
    return `<h1 class="text-3xl font-bold font-bricolage mb-4 heading-1">API Documentation</h1>
<p>Welcome to the documentation for ${apiName || "My API"}.</p>
<h2 class="text-2xl font-bold font-bricolage mt-6 mb-3 heading-2">Authentication</h2>
<p>Describe how to authenticate with your API. For example, you might use API keys or OAuth tokens.</p>
<pre class="code-block language-javascript bg-muted p-4 rounded-md my-4 overflow-x-auto">
<code>// Example authentication code
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})</code>
</pre>
<h2 class="text-2xl font-bold font-bricolage mt-6 mb-3 heading-2">Endpoints</h2>
<p>List and describe your API endpoints.</p>
<h3 class="text-xl font-bold font-bricolage mt-5 mb-2 heading-3">GET /users</h3>
<p>Retrieves a list of users.</p>
<p><strong>Query Parameters:</strong></p>
<ul class="list-disc pl-6 my-2">
  <li><code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">limit</code> - Maximum number of results to return</li>
  <li><code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">offset</code> - Number of results to skip</li>
</ul>
<blockquote class="border-l-4 border-muted pl-4 italic text-muted-foreground my-4">
  Note: This endpoint requires authentication.
</blockquote>`
  }

  // Apply formatting to selected text
  const applyFormatting = (command, value = null) => {
    if (!editorRef.current) return
    
    // Focus editor and restore selection if needed
    editorRef.current.focus()
    restoreSelection()
    
    // Apply the formatting command
    if (command === "strong" || command === "em" || command === "u") {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          const element = document.createElement(command)
          element.textContent = selectedText
          range.deleteContents()
          range.insertNode(element)
          
          // Set cursor position after the inserted element
          range.setStartAfter(element)
          range.setEndAfter(element)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    } else {
      // For other commands, use execCommand
      document.execCommand(command, false, value)
    }
    
    // Update the form data
    updateFormData({ documentation: editorRef.current.innerHTML })
    
    // Save the new selection
    saveSelection()
  }

  // Insert heading at current selection
  const insertHeading = (level) => {
    if (!editorRef.current) return
    
    // Focus editor and restore selection
    editorRef.current.focus()
    restoreSelection()
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    let selectedText = range.toString()
    
    if (!selectedText) {
      selectedText = `Heading ${level}`
    }
    
    // Create the heading element
    const headingElement = document.createElement(`h${level}`)
    headingElement.className = `text-${level === 1 ? "3xl" : level === 2 ? "2xl" : level === 3 ? "xl" : "lg"} font-bold font-bricolage heading-${level}`
    headingElement.textContent = selectedText
    
    // Insert the heading
    range.deleteContents()
    range.insertNode(headingElement)
    
    // Move cursor after the heading
    range.setStartAfter(headingElement)
    selection.removeAllRanges()
    selection.addRange(range)
    
    // Update form data
    updateFormData({ documentation: editorRef.current.innerHTML })
    
    // Save the selection
    saveSelection()
  }

  // Handle editor content changes
  const handleEditorInputChange = (e) => {
    // Update the form data with new content
    updateFormData({ documentation: editorRef.current.innerHTML })
    
    // Save the selection after input
    saveSelection()
  }

  // Insert code block at current selection
  const insertCodeBlock = (code) => {
    if (!editorRef.current || !code) return
    
    // Focus editor and restore selection
    editorRef.current.focus()
    restoreSelection()
    
    const codeHtml = `
      <pre class="code-block language-${codeLanguage} bg-muted p-4 rounded-md my-4 overflow-x-auto">
        <code>${code}</code>
      </pre>
    `
    
    // Insert the HTML
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      
      // Create a temporary element to hold the HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = codeHtml.trim()
      const codeElement = tempDiv.firstChild
      
      // Insert the element
      range.deleteContents()
      range.insertNode(codeElement)
      
      // Move cursor after the code block
      range.setStartAfter(codeElement)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    setShowCodeEditor(false)
    
    // Update form data
    updateFormData({ documentation: editorRef.current.innerHTML })
    
    // Save the selection
    saveSelection()
  }

  // Insert link at current selection
  const insertLink = () => {
    // Focus editor and restore selection
    editorRef.current.focus()
    restoreSelection()
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    const url = prompt("Enter URL:", "https://")
    const text = prompt("Enter link text:", selectedText || "Link text")
    
    if (url && text) {
      // Create link element
      const linkElement = document.createElement('a')
      linkElement.href = url
      linkElement.target = "_blank"
      linkElement.rel = "noopener noreferrer"
      linkElement.className = "text-primary underline hover:no-underline"
      linkElement.textContent = text
      
      // Insert the link
      range.deleteContents()
      range.insertNode(linkElement)
      
      // Move cursor after the link
      range.setStartAfter(linkElement)
      selection.removeAllRanges()
      selection.addRange(range)
      
      // Update form data
      updateFormData({ documentation: editorRef.current.innerHTML })
      
      // Save the selection
      saveSelection()
    }
  }

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        {/* Editor Mode Toggle */}
        <div className="flex justify-end p-2 bg-muted/30 border-b">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? "Edit" : "Preview"}
          </Button>
        </div>

        {/* Rich Text Editor Toolbar - Only visible in edit mode */}
        {!previewMode && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("strong")}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("em")}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("u")}
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* Headings */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                  <Heading1 className="h-4 w-4" />
                  <span>Heading</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0">
                <div className="grid gap-1 p-1">
                  <Button
                    variant="ghost"
                    className="justify-start font-bricolage text-xl"
                    onClick={() => insertHeading(1)}
                  >
                    Heading 1
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-bricolage text-lg"
                    onClick={() => insertHeading(2)}
                  >
                    Heading 2
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-bricolage text-base"
                    onClick={() => insertHeading(3)}
                  >
                    Heading 3
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start font-bricolage text-sm"
                    onClick={() => insertHeading(4)}
                  >
                    Heading 4
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* Lists */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("insertUnorderedList")}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("insertOrderedList")}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* Paragraph Formatting */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("formatBlock", "p")}
                title="Paragraph"
              >
                <Pilcrow className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("formatBlock", "blockquote")}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* Links and Code */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={insertLink}
                title="Insert Link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowCodeEditor(true)}
                title="Insert Code Block"
              >
                <FileCode className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  // Focus editor and restore selection
                  editorRef.current.focus()
                  restoreSelection()
                  
                  const selection = window.getSelection()
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0)
                    const selectedText = range.toString() || "code"
                    
                    // Create inline code element
                    const codeElement = document.createElement("code")
                    codeElement.className = "bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                    codeElement.textContent = selectedText
                    
                    // Insert the element
                    range.deleteContents()
                    range.insertNode(codeElement)
                    
                    // Move cursor after the code
                    range.setStartAfter(codeElement)
                    selection.removeAllRanges()
                    selection.addRange(range)
                    
                    // Update form data
                    updateFormData({ documentation: editorRef.current.innerHTML })
                    
                    // Save the selection
                    saveSelection()
                  }
                }}
                title="Inline Code"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1"></div>

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("justifyLeft")}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("justifyCenter")}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => applyFormatting("justifyRight")}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Code Editor Modal */}
        <CodeEditorModal
          isOpen={showCodeEditor}
          onClose={() => setShowCodeEditor(false)}
          onInsert={insertCodeBlock}
          codeSnippet={codeSnippet}
          setCodeSnippet={setCodeSnippet}
          codeLanguage={codeLanguage}
          setCodeLanguage={setCodeLanguage}
        />

        {/* Rich Text Editor Content Area */}
        <div
          ref={editorRef}
          className={`min-h-[300px] p-4 focus:outline-none prose dark:prose-invert max-w-none ${
            previewMode ? "pointer-events-none" : "editor-content"
          }`}
          contentEditable={!previewMode}
          onInput={handleEditorInputChange}
          onFocus={saveSelection}
          onBlur={saveSelection}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Backspace" || e.key === "Delete") {
              // Save selection after these key actions
              setTimeout(saveSelection, 0)
            }
          }}
          dir="ltr" // Force left-to-right text direction
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Use the toolbar above to format your documentation. You can add headings, lists, links, code blocks, and more.
      </p>
    </div>
  )
}

export default DocumentationEditor