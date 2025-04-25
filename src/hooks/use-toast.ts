
import * as React from "react"
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1 // Only show 1 toast at a time
const TOAST_REMOVE_DELAY = 2000 // 2 seconds toast duration

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
      toast: Omit<ToasterToast, "id">
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast> & { id: string }
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Performance tracking for toast operations
const trackPerformance = (operation: string, callback: Function) => {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  // console.log(`Toast operation '${operation}' took ${end - start}ms`);
  return result;
};

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId)!);
    toastTimeouts.delete(toastId);
  }

  const timeout = setTimeout(() => {
    trackPerformance('removeToast', () => {
      toastTimeouts.delete(toastId);
      dispatch({
        type: actionTypes.REMOVE_TOAST,
        toastId: toastId,
      });
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      // Check for duplicate toasts to prevent repetition
      const isDuplicate = state.toasts.some(
        t => 
          t.title === action.toast.title && 
          t.description === action.toast.description &&
          t.open === true
      );
      
      if (isDuplicate) {
        return state;
      }
      
      // If we're at the limit, dismiss the oldest toast
      if (state.toasts.length >= TOAST_LIMIT) {
        const oldestToast = state.toasts[state.toasts.length - 1];
        if (oldestToast) {
          dispatch({ type: actionTypes.DISMISS_TOAST, toastId: oldestToast.id });
        }
      }
      
      return {
        ...state,
        toasts: [
          { id: genId(), ...action.toast },
          ...state.toasts.slice(0, TOAST_LIMIT - 1),
        ],
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

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: ((state: State) => void)[] = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast(props: Toast) {
  return trackPerformance('createToast', () => {
    const id = genId()

    const update = (props: ToasterToast) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
  
    const dismiss = () => dispatch({ 
      type: actionTypes.DISMISS_TOAST, 
      toastId: id 
    })

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
          props.onOpenChange?.(open)
        },
      },
    })

    // Auto-dismiss after TOAST_REMOVE_DELAY
    addToRemoveQueue(id);

    return {
      id: id,
      dismiss,
      update,
    }
  });
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => trackPerformance('dismissToast', () => {
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId })
    }),
  }
}

export { useToast, toast }
