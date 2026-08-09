"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PromptOptions = {
  title?: string;
  description?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
};

type FeedbackApi = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  prompt: (options: PromptOptions | string) => Promise<string | null>;
  toast: typeof toast;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}

/** Safe outside provider for simple toast only */
export { toast };

type ConfirmState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  resolve: (value: boolean) => void;
};

type PromptState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  placeholder: string;
  value: string;
  resolve: (value: string | null) => void;
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const confirmOpenRef = useRef(false);
  const promptOpenRef = useRef(false);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const normalized =
      typeof options === "string" ? { description: options } : options;
    return new Promise<boolean>((resolve) => {
      confirmOpenRef.current = true;
      setConfirmState({
        open: true,
        title: normalized.title ?? "Confirm",
        description: normalized.description,
        confirmLabel: normalized.confirmLabel ?? "OK",
        cancelLabel: normalized.cancelLabel ?? "Cancel",
        destructive: Boolean(normalized.destructive),
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions | string) => {
    const normalized =
      typeof options === "string" ? { title: options } : options;
    return new Promise<string | null>((resolve) => {
      promptOpenRef.current = true;
      setPromptState({
        open: true,
        title: normalized.title ?? "Input",
        description: normalized.description ?? "",
        confirmLabel: normalized.confirmLabel ?? "OK",
        cancelLabel: normalized.cancelLabel ?? "Cancel",
        placeholder: normalized.placeholder ?? "",
        value: normalized.defaultValue ?? "",
        resolve,
      });
    });
  }, []);

  const api = useMemo<FeedbackApi>(
    () => ({ confirm, prompt, toast }),
    [confirm, prompt],
  );

  function finishConfirm(value: boolean) {
    if (!confirmState) return;
    confirmState.resolve(value);
    confirmOpenRef.current = false;
    setConfirmState(null);
  }

  function finishPrompt(value: string | null) {
    if (!promptState) return;
    promptState.resolve(value);
    promptOpenRef.current = false;
    setPromptState(null);
  }

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      <AlertDialog
        open={Boolean(confirmState?.open)}
        onOpenChange={(open) => {
          if (!open && confirmState) finishConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState?.title ?? "Confirm"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finishConfirm(false)}>
              {confirmState?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={confirmState?.destructive ? "destructive" : "default"}
              onClick={() => finishConfirm(true)}
            >
              {confirmState?.confirmLabel ?? "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(promptState?.open)}
        onOpenChange={(open) => {
          if (!open && promptState) finishPrompt(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{promptState?.title ?? "Input"}</DialogTitle>
            {promptState?.description ? (
              <DialogDescription>{promptState.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <Input
            autoFocus
            value={promptState?.value ?? ""}
            placeholder={promptState?.placeholder}
            onChange={(event) =>
              setPromptState((prev) =>
                prev ? { ...prev, value: event.target.value } : prev,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && promptState) {
                event.preventDefault();
                finishPrompt(promptState.value);
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => finishPrompt(null)}
            >
              {promptState?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={() => finishPrompt(promptState?.value ?? "")}
            >
              {promptState?.confirmLabel ?? "OK"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FeedbackContext.Provider>
  );
}
