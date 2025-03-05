"use client"

import { useCallback } from "react"

/**
 * Custom hook to manage editor selection state
 * This helps solve the cursor jumping issue in contentEditable elements
 */
function useEditorSelection(editorRef) {
  // Save current selection state
  const saveSelection = useCallback(() => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Selection is saved automatically by the browser
    // We just need this function as a hook point
  }, [editorRef])

  // Handle editor input with selection preservation
  const handleEditorInput = useCallback((e, updateCallback) => {
    // Save the current selection
    const selection = window.getSelection()
    if (!selection) return

    const ranges = []
    for (let i = 0; i < selection.rangeCount; i++) {
      ranges.push(selection.getRangeAt(i).cloneRange())
    }

    // Update the content via callback
    const newContent = e.currentTarget.innerHTML
    updateCallback(newContent)

    // Restore the selection after React updates the DOM
    requestAnimationFrame(() => {
      selection.removeAllRanges()
      ranges.forEach((range) => selection.addRange(range))
    })
  }, [])

  return {
    saveSelection,
    handleEditorInput,
  }
}

export default useEditorSelection

