// src/components/create-api/documentation-editor.jsx
import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Link, List, ListOrdered, Heading1, Heading2, Code, Quote, Image } from "lucide-react";

function DocumentationEditor({ formData, updateFormData, setEditorRef }) {
  const editorRef = useRef(null);

  // Initialize the editor with existing content and pass the ref to the parent
  useEffect(() => {
    if (editorRef.current && formData.documentation) {
      editorRef.current.innerHTML = formData.documentation;
    }
    if (editorRef.current) {
      setEditorRef(editorRef.current);
    }
  }, [formData.documentation, setEditorRef]);

  // Function to execute a formatting command
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // Insert a code block
  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const text = selection.toString();
    const codeBlock = `<pre class="bg-muted p-4 rounded-md overflow-x-auto font-mono text-sm my-4">${
      text || "Your code here"
    }</pre>`;
    document.execCommand("insertHTML", false, codeBlock);
    editorRef.current.focus();
  };

  // Insert an example request
  const insertRequestExample = () => {
    const template = `
<div class="border rounded-md p-4 my-4">
  <h3 class="text-base font-semibold mb-2">Example Request</h3>
  <pre class="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">
curl -X GET "${formData.baseUrl}/endpoint" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-H "Content-Type: application/json"
  </pre>
</div>
`;
    document.execCommand("insertHTML", false, template);
    editorRef.current.focus();
  };

  // Insert an example response
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
`;
    document.execCommand("insertHTML", false, template);
    editorRef.current.focus();
  };

  // Insert a visual divider
  const insertDivider = () => {
    document.execCommand("insertHTML", false, '<hr class="my-6 border-t-2 border-muted">');
    editorRef.current.focus();
  };

  // Insert endpoint documentation based on defined endpoints
  const insertEndpointDocs = () => {
    if (!formData.endpoints || formData.endpoints.length === 0) {
      alert("No endpoints have been defined yet.");
      return;
    }

    let endpointsHtml = '<div class="my-6"><h2 class="text-xl font-bold mb-4">API Endpoints</h2>';
    formData.endpoints.forEach((endpoint, index) => {
      const methodColorClass = {
        GET: "bg-green-100 text-green-800",
        POST: "bg-blue-100 text-blue-800",
        PUT: "bg-yellow-100 text-yellow-800",
        DELETE: "bg-red-100 text-red-800",
        PATCH: "bg-purple-100 text-purple-800",
      }[endpoint.method] || "bg-gray-100 text-gray-800";

      endpointsHtml += `
<div class="border rounded-md p-4 my-4">
  <div class="flex items-center gap-2 mb-2">
    <span class="px-2 py-1 rounded-md text-xs font-medium ${methodColorClass}">${endpoint.method}</span>
    <code class="font-mono text-sm">${formData.baseUrl}${endpoint.path}</code>
  </div>
  ${endpoint.description ? `<p class="mb-3 text-muted-foreground">${endpoint.description}</p>` : ""}
`;

      // Parameters section
      if (endpoint.parameters && endpoint.parameters.length > 0) {
        endpointsHtml += `
  <div class="mt-4">
    <h4 class="text-sm font-semibold mb-2">Parameters</h4>
    <div class="grid grid-cols-3 gap-2 text-sm">
      <div class="font-medium">Name</div>
      <div class="font-medium">Required</div>
      <div class="font-medium">Description</div>
`;
        endpoint.parameters.forEach((param) => {
          endpointsHtml += `
      <div class="font-mono">${param.name}</div>
      <div>${param.required ? "Yes" : "No"}</div>
      <div>${param.description || "-"}</div>
`;
        });
        endpointsHtml += `
    </div>
  </div>
`;
      }

      // Request body section
      if (endpoint.requestBody) {
        endpointsHtml += `
  <div class="mt-4">
    <h4 class="text-sm font-semibold mb-2">Request Body</h4>
    <pre class="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">${JSON.stringify(
      JSON.parse(endpoint.requestBody),
      null,
      2
    )}</pre>
  </div>
`;
      }

      // Response example section
      if (endpoint.responseExample) {
        endpointsHtml += `
  <div class="mt-4">
    <h4 class="text-sm font-semibold mb-2">Response</h4>
    <pre class="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">${JSON.stringify(
      JSON.parse(endpoint.responseExample),
      null,
      2
    )}</pre>
  </div>
`;
      }

      endpointsHtml += `
</div>
`;
    });
    endpointsHtml += "</div>";
    document.execCommand("insertHTML", false, endpointsHtml);
    editorRef.current.focus();
  };

  return (
    <div className="space-y-4">
      {/* Documentation Header */}
      <div className="space-y-2">
        <Label htmlFor="documentation">API Documentation</Label>
        <p className="text-sm text-muted-foreground">
          Provide comprehensive documentation for your API. Include descriptions, examples, and usage instructions.
        </p>
      </div>

      {/* Editor Toolbar */}
      <Card className="p-1 border">
        <div className="bg-muted p-2 flex flex-wrap gap-1 border-b">
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt("Enter link URL:");
              if (url) execCommand("createLink", url);
            }}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "<h2>")}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "<h3>")}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertCodeBlock}>
            <Code className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "<blockquote>")}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) execCommand("insertImage", url);
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
          <Button type="button" variant="ghost" size="sm" onClick={insertDivider}>
            Divider
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={insertEndpointDocs}>
            Insert Endpoints
          </Button>
        </div>

        {/* Editor Content */}
        <div
          ref={editorRef}
          className="min-h-[400px] p-4 prose prose-sm max-w-none focus:outline-none"
          contentEditable
          dangerouslySetInnerHTML={{ __html: formData.documentation || "<p>Start documenting your API here...</p>" }}
          onBlur={() => {
            if (editorRef.current) {
              updateFormData({ documentation: editorRef.current.innerHTML });
            }
          }}
        />
      </Card>

      {/* Documentation Tips */}
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Documentation Tips:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Start with an overview of what your API does</li>
          <li>Explain authentication requirements</li>
          <li>Document each endpoint with examples</li>
          <li>Include sample request and response formats</li>
          <li>Describe error handling and status codes</li>
        </ul>
      </div>
    </div>
  );
}

export default DocumentationEditor;