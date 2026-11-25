"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { AudioPermissionState } from "../types";

interface AudioRecorderProps {
  permissionState: AudioPermissionState;
  audioBlob: Blob | null;
  onAudioCaptured: (
    blob: Blob | null,
    durationMs: number | null,
    permission: AudioPermissionState,
  ) => void;
  onSkip: (permission: AudioPermissionState) => void;
}

const MAX_SECONDS = 10;

export function AudioRecorder({
  permissionState,
  audioBlob,
  onAudioCaptured,
  onSkip,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function startRecording() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      onAudioCaptured(null, null, "unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const elapsedMs = Math.min(10_000, Date.now() - startTimeRef.current);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        onAudioCaptured(blob, elapsedMs, "granted");
      };

      setSecondsLeft(MAX_SECONDS);
      setIsRecording(true);
      recorder.start();

      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      onAudioCaptured(null, null, "denied");
    }
  }

  const isDeniedOrUnsupported =
    permissionState === "denied" || permissionState === "unsupported";

  return (
    <div className="space-y-4">
      <p className="text-body leading-relaxed text-muted-ink">
        {copy.routes.report.step5.explanation}
      </p>

      {isDeniedOrUnsupported ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md bg-surface-subtle p-4 text-body text-muted-ink"
        >
          <MicOff className="mt-0.5 size-5 shrink-0 text-subtle-ink" aria-hidden="true" />
          <p>{copy.routes.report.step5.deniedMessage}</p>
        </div>
      ) : null}

      {isRecording ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-accent-border bg-accent-soft p-4">
          <div className="flex items-center gap-3">
            <span className="inline-block size-3 rounded-full bg-accent-primary" />
            <span className="text-body font-semibold text-strong">
              {copy.routes.report.step5.recordingLabel}{" "}
              <span className="font-mono tabular-nums">{secondsLeft}s</span>
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={stopRecording}
            className="min-h-[44px]"
          >
            <Square className="mr-2 size-4" aria-hidden="true" />
            {copy.routes.report.step5.stopRecordingButton}
          </Button>
        </div>
      ) : audioBlob ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-success-border bg-success-soft p-4">
          <span className="text-body font-medium text-success">
            {copy.routes.report.step5.recordedLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            className="min-h-[44px]"
          >
            {copy.routes.report.step5.reRecordButton}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={startRecording}
            className="min-h-[48px] bg-strong text-surface hover:bg-strong/90"
          >
            <Mic className="mr-2 size-4" aria-hidden="true" />
            {copy.routes.report.step5.allowMicButton}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSkip("skipped")}
            className="min-h-[48px]"
          >
            {copy.routes.report.step5.skipButton}
          </Button>
        </div>
      )}
    </div>
  );
}
