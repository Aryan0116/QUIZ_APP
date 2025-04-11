// Likely path: @/hooks/use-toast.ts or @/components/ui/use-toast.ts
// (Ensure your import paths match where you save this)

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast" // Assuming path

const TOAST_LIMIT = 0
const TOAST_REMOVE_DELAY = 5000 // Default 5 seconds removal delay *after* dismissal

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: Omit<ToasterToast, "id"> // Input doesn't have ID yet
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & { id: string } // Update needs ID
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)!)
    toastTimeouts.delete(toastId)
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    // Trigger removal from React state
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST: {
       // Optional: Prevent exact duplicates currently visible
      // const isDuplicate = state.toasts.some(t =>
      //     t.title === action.toast.title &&
      //     t.description === action.toast.description &&
      //     t.variant === action.toast.variant && // Consider variant too
      //     t.open === true);
      // if (isDuplicate) return state;

      return {
        ...state,
        // Add new toast to the beginning, respect limit
        toasts: [
           { id: genId(), ...action.toast }, // Add ID here
           ...state.toasts,
        ].slice(0, TOAST_LIMIT),
      }
    }


    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // Schedule removal from the DOM after dismissal
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        // Dismiss all: schedule removal for all currently displayed toasts
        state.toasts.forEach((toast) => {
           if (toast.open) { // Avoid scheduling removal for already dismissed ones
            addToRemoveQueue(toast.id)
           }
        })
      }

      // Update React state to set open = false
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false } // Target specific toast or all
            : t
        ),
      }
    }

    case actionTypes.REMOVE_TOAST:
      // Remove toast from React state after the timeout (triggered by addToRemoveQueue)
      if (action.toastId === undefined) {
        // Remove all toasts
        return { ...state, toasts: [] }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }

    default:
       return state;
  }
}

// --- Global State Management ---
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  // Notify all subscribed components
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// --- Public API ---

type Toast = Omit<ToasterToast, "id"> // User provides toast props without ID

/**
 * Displays a toast notification.
 * @param props - Toast properties (title, description, variant, duration, etc.)
 * @returns Object containing the toast's id, dismiss function, and update function.
 */
function toast(props: Toast) {
  const id = genId()

  const update = (newProps: Partial<Toast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...newProps, id }, // Include ID for update target
    })

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  // Add the toast to the state
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      open: true, // Ensure toast starts open
      // The crucial part: wire up Radix's onOpenChange to our dismiss action
      onOpenChange: (open) => {
        if (!open) {
          dismiss() // Trigger dismiss logic when Radix signals close
        }
        // Call user's original onOpenChange if they provided one
        props.onOpenChange?.(open)
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Hook to access toast state and methods.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  // Subscribe to global state changes
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      // Clean up listener on unmount
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state]) // Re-subscribe if state instance changes (shouldn't normally)

  return {
    ...state, // Expose current toasts array
    toast,    // Expose the function to create toasts
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, toast }