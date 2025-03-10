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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import MDEditor from "@uiw/react-md-editor";

// Documentation schema
const docSchema = z.object({
  documentation: z.string().optional(),
});

const DocumentationEditorDialog = ({ open, onOpenChange, documentation, onSave, isSubmitting }) => {
  const form = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: {
      documentation: documentation || "",
    },
    mode: "onSubmit",
  });

  return (
    <Dialog open={open} onOpenChange={(value) => !isSubmitting && onOpenChange(value)}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Documentation</DialogTitle>
          <DialogDescription>
            Update documentation using Markdown. Preview will be shown below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Form {...form}>
            <form id="doc-edit-form" onSubmit={form.handleSubmit(onSave)}>
              <FormField
                control={form.control}
                name="documentation"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div style={{ maxHeight: '60vh', overflow: 'hidden' }}>
                        <MDEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          height={400}
                          preview="edit"
                          visiableDragbar={false}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Use Markdown to format your documentation.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
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
          >
            {isSubmitting ? "Saving..." : "Save Documentation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentationEditorDialog;