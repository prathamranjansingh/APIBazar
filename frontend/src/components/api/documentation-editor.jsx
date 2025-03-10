import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import MDEditor from "@uiw/react-md-editor";

// Form validation schema
const docSchema = z.object({
  documentation: z.string().optional(),
});

const DocumentationEditor = ({ api, open, onOpenChange, onSubmit, isSubmitting }) => {
  const defaultValues = {
    documentation: api?.documentation || "",
  };

  const form = useForm({
    resolver: zodResolver(docSchema),
    defaultValues,
  });

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not submitting
      if (!isSubmitting || !isOpen) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit API Documentation</DialogTitle>
          <DialogDescription>
            Update the documentation for your API. Markdown formatting is supported.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="documentation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div data-color-mode="light" className="dark:hidden">
                      <MDEditor
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        preview="edit"
                        height={500}
                      />
                    </div>
                    <div data-color-mode="dark" className="hidden dark:block">
                      <MDEditor
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        preview="edit"
                        height={500}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Use Markdown to format your documentation. You can include code examples, tables, and more.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">↻</span>
                    Saving...
                  </>
                ) : (
                  "Save Documentation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentationEditor;