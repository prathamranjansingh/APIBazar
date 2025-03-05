
import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useApi} from "../contexts/api-context" 
import "./documentation-editor.css";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  ArrowLeft,
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
  Check,
  Copy,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Editor from "react-simple-code-editor"
import { highlight, languages } from "prismjs"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-json"
import "prismjs/components/prism-css"
import "prismjs/components/prism-markdown"
import "prismjs/themes/prism.css"

function CreateApi() {
  const navigate = useNavigate()
  const { createApi, loading } = useApi()
  const [formData, setFormData] = useState({
    name: "Sample API",
    baseUrl: "https://example.com",
    description: "This is a sample API",
    documentation: "",
    category: "GENERAL",
    pricingModel: "FREE",
  })
  const [activeTab, setActiveTab] = useState("basic")
  const editorRef = useRef(null)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState("// Enter your code here")
  const [codeLanguage, setCodeLanguage] = useState("javascript")
  const [isCopied, setIsCopied] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const editor = editorRef.current
    if (editor) {
      editor.addEventListener("paste", handlePaste)
    }
    return () => {
      if (editor) {
        editor.removeEventListener("paste", handlePaste)
      }
    }
  }, [])

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePricingChange = (value) => {
    setFormData((prev) => ({ ...prev, pricingModel: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.baseUrl) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      })
      return
    }

    const documentationContent = editorRef.current ? editorRef.current.innerHTML : formData.documentation

    try {
      const newApi = await createApi({
        name: formData.name,
        baseUrl: formData.baseUrl,
        description: formData.description,
        documentation: documentationContent,
        category: formData.category,
        pricingModel: formData.pricingModel,
      })

      if (newApi) {
        navigate(`/apis/${newApi.id}`)
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create API. Please try again.",
      })
    }
  }

  const isFormValid = () => {
    return formData.name && formData.baseUrl
  }

  const applyFormatting = (command, value = null) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (selectedText) {
      // If text is selected, wrap it with the appropriate tag
      const node = document.createElement(command === "formatBlock" ? value : command)
      node.textContent = selectedText
      range.deleteContents()
      range.insertNode(node)
    } else {
      // If no text is selected, just execute the command
      document.execCommand(command, false, value)
    }

    editorRef.current.focus()
  }

  const insertHeading = (level) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      const headingElement = document.createElement(`h${level}`)
      headingElement.textContent = selectedText || `Heading ${level}`
      headingElement.className = `text-${level === 1 ? "3xl" : level === 2 ? "2xl" : level === 3 ? "xl" : "lg"} font-bold heading-${level}`

      range.deleteContents()
      range.insertNode(headingElement)

      // Move the cursor to the end of the inserted heading
      const newRange = document.createRange()
      newRange.setStartAfter(headingElement)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }

    editorRef.current.focus()
  }

  const insertCodeBlock = () => {
    if (!editorRef.current || !codeSnippet) return

    const highlightedCode = highlight(codeSnippet, languages[codeLanguage] || languages.javascript, codeLanguage)

    const codeHtml = `
      <pre class="code-block language-${codeLanguage} bg-muted p-4 rounded-md my-4 overflow-x-auto">
        <code>${highlightedCode}</code>
      </pre>
    `

    document.execCommand("insertHTML", false, codeHtml)
    setShowCodeEditor(false)
    editorRef.current.focus()
  }

  const copyToClipboard = useCallback(() => {
    if (codeSnippet) {
      navigator.clipboard.writeText(codeSnippet)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }, [codeSnippet])

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://")
    const text = prompt("Enter link text:", "Link text")

    if (url && text) {
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">${text}</a>`
      document.execCommand("insertHTML", false, linkHtml)
    }
  }

  return (
    <div className="space-y-6 font-inter">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/apis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight font-bricolage">Create New API</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the basic details about your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    API Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Awesome API"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what your API does..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="GENERAL">General</option>
                    <option value="FINANCE">Finance</option>
                    <option value="WEATHER">Weather</option>
                    <option value="SOCIAL">Social</option>
                    <option value="ECOMMERCE">E-Commerce</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="DATA">Data & Analytics</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl">
                    Base URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="baseUrl"
                    name="baseUrl"
                    placeholder="https://api.example.com"
                    value={formData.baseUrl}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The base URL for your API (e.g., https://api.example.com)
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/apis")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("pricing")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Access</CardTitle>
                <CardDescription>Configure how users will access and pay for your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <RadioGroup value={formData.pricingModel} onValueChange={handlePricingChange} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FREE" id="free" />
                      <Label htmlFor="free" className="font-normal cursor-pointer">
                        Free - Anyone can use your API without payment
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PAID" id="paid" />
                      <Label htmlFor="paid" className="font-normal cursor-pointer">
                        Paid - Users pay per API call or in packages
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SUBSCRIPTION" id="subscription" />
                      <Label htmlFor="subscription" className="font-normal cursor-pointer">
                        Subscription - Users pay a recurring fee for access
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.pricingModel !== "FREE" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      You'll be able to configure detailed pricing options after creating your API.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("basic")}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("documentation")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Provide documentation for your API using the rich text editor below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                            onClick={() => applyFormatting("formatBlock", "<p>")}
                            title="Paragraph"
                          >
                            <Pilcrow className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => applyFormatting("formatBlock", "<blockquote>")}
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
                              const selection = window.getSelection()
                              if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0)
                                const selectedText = range.toString()

                                const codeElement = document.createElement("code")
                                codeElement.className = "bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                codeElement.textContent = selectedText || "code"

                                range.deleteContents()
                                range.insertNode(codeElement)
                              }
                              editorRef.current.focus()
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
                    {showCodeEditor && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium font-bricolage">Insert Code Snippet</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowCodeEditor(false)}>
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
                                <option value="javascript">JavaScript</option>
                                <option value="jsx">JSX</option>
                                <option value="typescript">TypeScript</option>
                                <option value="python">Python</option>
                                <option value="json">JSON</option>
                                <option value="css">CSS</option>
                                <option value="markdown">Markdown</option>
                              </select>
                            </div>

                            <div className="border rounded-md relative">
                              <div className="absolute top-2 right-2 z-10">
                                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 w-8 p-0">
                                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              <Editor
                                value={codeSnippet}
                                onValueChange={(code) => setCodeSnippet(code)}
                                highlight={(code) =>
                                  highlight(code, languages[codeLanguage] || languages.javascript, codeLanguage)
                                }
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
                              <Button variant="outline" onClick={() => setShowCodeEditor(false)}>
                                Cancel
                              </Button>
                              <Button onClick={insertCodeBlock}>Insert Code</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rich Text Editor Content Area */}
                    <div
                      ref={editorRef}
                      className={`min-h-[300px] p-4 focus:outline-none prose dark:prose-invert max-w-none ${previewMode ? "pointer-events-none" : "editor-content"}`}
                      contentEditable={!previewMode}
                      dangerouslySetInnerHTML={{
                        __html:
                          formData.documentation ||
                          `<h1 class="text-3xl font-bold font-bricolage mb-4 heading-1">API Documentation</h1>
<p>Welcome to the documentation for ${formData.name || "My API"}.</p>
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
</blockquote>`,
                      }}
                      onInput={(e) => setFormData((prev) => ({ ...prev, documentation: e.target.innerHTML }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the toolbar above to format your documentation. You can add headings, lists, links, code blocks,
                    and more.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("pricing")}>
                  Back
                </Button>
                <Button type="submit" disabled={!isFormValid() || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create API"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}

export default CreateApi

