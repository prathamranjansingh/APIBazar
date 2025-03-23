import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link, Image, Code, Quote, Undo, Redo, Eye, Edit, FileText, HelpCircle, Loader2 } from 'lucide-react';
import { marked } from "marked";

// Documentation schema
const docSchema = z.object({
  documentation: z.string().optional(),
});

// Markdown toolbar button component
const ToolbarButton = ({ icon, onClick, tooltip, active = false }) => {
  return (
    <div className="relative group">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          active && "bg-muted text-primary"
        )}
        onClick={onClick}
      >
        {icon}
        <span className="sr-only">{tooltip}</span>
      </Button>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {tooltip}
      </div>
    </div>
  );
};

const DocumentationEditorDialog = ({ 
  open, 
  onOpenChange, 
  documentation = "", 
  onSave, 
  isSubmitting 
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [textareaRef, setTextareaRef] = useState(null);

  const form = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: {
      documentation: documentation || "",
    },
    mode: "onChange",
  });

  const watchDocumentation = form.watch("documentation");

  // Update preview when documentation changes
  useEffect(() => {
    try {
      const html = marked(watchDocumentation || "");
      setPreviewHtml(html);
    } catch (error) {
      console.error("Error parsing markdown:", error);
      setPreviewHtml("<p>Error parsing markdown</p>");
    }
  }, [watchDocumentation]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle text selection for toolbar actions
  const handleTextareaSelect = (e) => {
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
  };

  // Insert markdown at cursor position or around selected text
  const insertMarkdown = (prefix, suffix = "") => {
    if (!textareaRef) return;

    const currentValue = form.getValues("documentation") || "";
    const beforeSelection = currentValue.substring(0, selectionStart);
    const selection = currentValue.substring(selectionStart, selectionEnd);
    const afterSelection = currentValue.substring(selectionEnd);

    const newValue = beforeSelection + prefix + selection + suffix + afterSelection;
    form.setValue("documentation", newValue, { shouldDirty: true });

    // Focus and set cursor position after update
    setTimeout(() => {
      textareaRef.focus();
      const newCursorPos = selection 
        ? selectionStart + prefix.length + selection.length + suffix.length
        : selectionStart + prefix.length;
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Toolbar action handlers
  const toolbarActions = {
    bold: () => insertMarkdown("**", "**"),
    italic: () => insertMarkdown("*", "*"),
    h1: () => insertMarkdown("# "),
    h2: () => insertMarkdown("## "),
    h3: () => insertMarkdown("### "),
    ul: () => insertMarkdown("- "),
    ol: () => insertMarkdown("1. "),
    link: () => {
      const selection = watchDocumentation?.substring(selectionStart, selectionEnd) || "";
      const text = selection || "link text";
      insertMarkdown(`[${text}](`, ")");
    },
    image: () => {
      const selection = watchDocumentation?.substring(selectionStart, selectionEnd) || "";
      const alt = selection || "image alt text";
      insertMarkdown(`![${alt}](`, ")");
    },
    code: () => insertMarkdown("```\n", "\n```"),
    inlineCode: () => insertMarkdown("`", "`"),
    quote: () => insertMarkdown("> "),
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(value) => !isSubmitting && onOpenChange(value)}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Documentation
          </DialogTitle>
          <DialogDescription>
            Create and format documentation using Markdown. Preview will update in real-time.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form id="doc-edit-form" onSubmit={form.handleSubmit(onSave)}>
              <div className="p-6 pt-2 pb-0">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <TabsList>
                      <TabsTrigger value="edit" className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="help" className="flex items-center gap-1">
                        <HelpCircle className="h-4 w-4" />
                        Help
                      </TabsTrigger>
                    </TabsList>
                    
                    {activeTab === "edit" && (
                      <div className="flex items-center space-x-1 border rounded-md bg-muted/40">
                        <ToolbarButton 
                          icon={<Bold className="h-4 w-4" />} 
                          onClick={toolbarActions.bold} 
                          tooltip="Bold"
                        />
                        <ToolbarButton 
                          icon={<Italic className="h-4 w-4" />} 
                          onClick={toolbarActions.italic} 
                          tooltip="Italic"
                        />
                        <ToolbarButton 
                          icon={<Heading1 className="h-4 w-4" />} 
                          onClick={toolbarActions.h1} 
                          tooltip="Heading 1"
                        />
                        <ToolbarButton 
                          icon={<Heading2 className="h-4 w-4" />} 
                          onClick={toolbarActions.h2} 
                          tooltip="Heading 2"
                        />
                        <ToolbarButton 
                          icon={<List className="h-4 w-4" />} 
                          onClick={toolbarActions.ul} 
                          tooltip="Bullet List"
                        />
                        <ToolbarButton 
                          icon={<ListOrdered className="h-4 w-4" />} 
                          onClick={toolbarActions.ol} 
                          tooltip="Numbered List"
                        />
                        <ToolbarButton 
                          icon={<Link className="h-4 w-4" />} 
                          onClick={toolbarActions.link} 
                          tooltip="Link"
                        />
                        <ToolbarButton 
                          icon={<Image className="h-4 w-4" />} 
                          onClick={toolbarActions.image} 
                          tooltip="Image"
                        />
                        <ToolbarButton 
                          icon={<Code className="h-4 w-4" />} 
                          onClick={toolbarActions.code} 
                          tooltip="Code Block"
                        />
                        <ToolbarButton 
                          icon={<Quote className="h-4 w-4" />} 
                          onClick={toolbarActions.quote} 
                          tooltip="Quote"
                        />
                      </div>
                    )}
                  </div>

                  <TabsContent value="edit" className="mt-0">
                    <FormField
                      control={form.control}
                      name="documentation"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              ref={(ref) => setTextareaRef(ref)}
                              placeholder="Write your documentation here using Markdown..."
                              className="min-h-[400px] font-mono text-sm resize-none p-4"
                              onSelect={handleTextareaSelect}
                              onClick={handleTextareaSelect}
                              onKeyUp={handleTextareaSelect}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                    <div className={cn(
                      "border rounded-md min-h-[400px] p-4 overflow-auto",
                      "prose max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-2"
                    )}>
                      {previewHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      ) : (
                        <p className="text-muted-foreground italic">No content to preview</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="help" className="mt-0">
                    <ScrollArea className="border rounded-md h-[400px] p-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium">Markdown Basics</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Headers</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                              # Heading 1<br/>
                              ## Heading 2<br/>
                              ### Heading 3
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Emphasis</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                              *italic* or _italic_<br/>
                              **bold** or __bold__<br/>
                              ~~strikethrough~~
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Lists</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                              - Unordered item<br/>
                              - Another item<br/>
                              <br/>
                              1. Ordered item<br/>
                              2. Another item
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Links & Images</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                              [Link text](https://example.com)<br/>
                              <br/>
                              ![Alt text](image-url.jpg)
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Code</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                              `inline code`<br/>
                              <br/>
                              ```<br/>
                              code block<br/>
                              ```
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">Blockquotes</h4>
                            <pre className="text-xs bg-muted p-2 rounded-md">
                               This is a blockquote<br/>
                               It can span multiple lines
                            </pre>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="p-2 text-xs text-muted-foreground text-right">
                {watchDocumentation?.length || 0} characters
              </div>
            </form>
          </Form>
        )}

        <DialogFooter className="p-6 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="doc-edit-form"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Documentation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentationEditorDialog;