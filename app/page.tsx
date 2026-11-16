"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Camera,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";

interface DetectionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DetectionItem {
  name?: string;
  class?: number;
  confidence: number;
  box: DetectionBox;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.25);
  const [iou, setIou] = useState<number>(0.5);
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop webcam stream when component unmounts or mode toggles off
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const startWebcam = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setErrorMessage("Could not access webcam. Please check browser permissions.");
    }
  };

  const captureWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        setSelectedFile(file);
        setPreviewUrl(canvas.toDataURL("image/jpeg"));
        stopWebcam();
      }
    }, "image/jpeg", 0.95);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetections([]);
      setErrorMessage(null);
      stopWebcam();
    }
  };

  // Run face detection through Vercel API Route
  const runDetection = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("conf", confidence.toString());
      formData.append("iou", iou.toString());

      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));

      if (!res.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      if (data.setupRequired) {
        setSetupNotice(data.message);
      } else {
        setSetupNotice(null);
      }

      if (data.predictions) {
        setDetections(data.predictions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during inference.");
    } finally {
      setLoading(false);
    }
  };

  // Draw bounding boxes on canvas whenever detections or image changes
  useEffect(() => {
    if (!imageRef.current || !canvasRef.current) return;
    const img = imageRef.current;
    const canvas = canvasRef.current;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length === 0) return;

    detections.forEach((det, idx) => {
      let { x1, y1, x2, y2 } = det.box;

      // Handle normalized coordinates (0-1) vs pixel coordinates
      if (x1 <= 1.0 && x2 <= 1.0 && y1 <= 1.0 && y2 <= 1.0) {
        x1 = x1 * canvas.width;
        x2 = x2 * canvas.width;
        y1 = y1 * canvas.height;
        y2 = y2 * canvas.height;
      }

      const boxWidth = x2 - x1;
      const boxHeight = y2 - y1;

      // Draw bounding box
      ctx.strokeStyle = "#10B981"; // Emerald green
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 300));
      ctx.strokeRect(x1, y1, boxWidth, boxHeight);

      // Label background & text
      const label = `${det.name || "Face"} ${(det.confidence * 100).toFixed(1)}%`;
      ctx.font = `bold ${Math.max(16, Math.round(canvas.width / 40))}px sans-serif`;
      const textMetrics = ctx.measureText(label);
      const textHeight = Math.max(18, Math.round(canvas.width / 40));

      ctx.fillStyle = "#10B981";
      ctx.fillRect(x1, y1 - textHeight - 8, textMetrics.width + 12, textHeight + 8);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, x1 + 6, y1 - 6);
    });
  }, [detections, previewUrl]);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Face Detection
            </h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              YOLO Nano (exp-2)
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Trained on Ultralytics Hub by{" "}
            <span className="font-semibold text-slate-700">Nhyirah</span> • Deployed to Vercel
          </p>
        </div>
        <a
          href="https://platform.ultralytics.com/nhyirah/ai-face-detection-model/exp-2"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          View Model on Ultralytics Hub
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </header>

      {/* Setup notification banner if credentials are not configured */}
      {setupNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Preview Demo Mode Active</p>
            <p>{setupNotice}</p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls & Input Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Input Source Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-semibold text-slate-800">1. Select Input Source</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-slate-700 hover:text-blue-600"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs font-semibold">Upload Photo</span>
              </button>

              <button
                onClick={isWebcamActive ? captureWebcam : startWebcam}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  isWebcamActive
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600"
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs font-semibold">
                  {isWebcamActive ? "Capture Snapshot" : "Use Webcam"}
                </span>
              </button>
            </div>
          </div>

          {/* Model Inference Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-800">2. Threshold Settings</h2>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Confidence Threshold</span>
                <span className="font-semibold text-slate-900">{Math.round(confidence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>IoU NMS Threshold</span>
                <span className="font-semibold text-slate-900">{Math.round(iou * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={iou}
                onChange={(e) => setIou(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <button
              onClick={runDetection}
              disabled={!selectedFile || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                !selectedFile || loading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Inference...
                </>
              ) : (
                "Detect Faces"
              )}
            </button>
          </div>

          {/* Inference Stats Card */}
          {detections.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Detection Results
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-xs text-slate-500">Faces Detected</span>
                  <p className="text-xl font-bold text-slate-900">{detections.length}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-xs text-slate-500">Inference Time</span>
                  <p className="text-xl font-bold text-slate-900">{latency ? `${latency} ms` : "—"}</p>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2 max-h-48 overflow-y-auto">
                {detections.map((det, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <span className="font-medium text-slate-700">Face #{index + 1}</span>
                    <span className="font-semibold text-emerald-600">
                      {(det.confidence * 100).toFixed(1)}% conf
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image & Canvas Display Area */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
          {isWebcamActive ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-h-[500px] w-auto rounded-xl shadow-lg"
              />
              <button
                onClick={captureWebcam}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold text-sm shadow-lg flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Snapshot
              </button>
            </div>
          ) : previewUrl ? (
            <div className="relative inline-block max-w-full">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Selected Face"
                className="max-h-[550px] w-auto rounded-xl block object-contain"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 flex flex-col items-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-semibold text-slate-200">No Image Selected</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Upload a photo or take a webcam snapshot to run face detection using your YOLO model.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
