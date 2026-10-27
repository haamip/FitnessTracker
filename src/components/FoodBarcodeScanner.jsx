import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanBarcode } from "lucide-react";
import { FOOD_BARCODE_FORMATS, readFoodBarcode } from "../services/foodBarcodeScanner";
import "./FoodBarcodeScanner.css";

/**
 * Uses the browser's native BarcodeDetector so a scan never needs to upload
 * an image. Camera permission is requested only after the user taps Scan.
 */
export default function FoodBarcodeScanner({ onDetected, disabled = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const sessionRef = useRef(0);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("");

  const stopScanner = useCallback(() => {
    sessionRef.current += 1;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) stopScanner();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopScanner();
    };
  }, [stopScanner]);

  async function startScanner() {
    if (disabled || scanning) return;
    setStatus("");

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera scanning needs an HTTPS page and camera permission. You can still type the barcode.");
      return;
    }
    if (typeof window.BarcodeDetector !== "function") {
      setStatus("This browser does not support live barcode reading. Try Chrome on Android or enter the barcode number below.");
      return;
    }

    stopScanner();
    const token = sessionRef.current + 1;
    sessionRef.current = token;
    try {
      const supported = typeof window.BarcodeDetector.getSupportedFormats === "function"
        ? await window.BarcodeDetector.getSupportedFormats()
        : FOOD_BARCODE_FORMATS;
      if (sessionRef.current !== token) return;
      const formats = FOOD_BARCODE_FORMATS.filter((format) => supported.includes(format));
      if (!formats.length) {
        setStatus("This browser cannot read food barcodes. Please enter the number manually.");
        return;
      }

      const detector = new window.BarcodeDetector({ formats });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (sessionRef.current !== token) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopScanner();
        return;
      }
      video.srcObject = stream;
      setScanning(true);
      await video.play();
      if (sessionRef.current !== token) return;

      const scanFrame = async () => {
        if (sessionRef.current !== token) return;
        try {
          if (video.readyState >= 2) {
            const barcode = readFoodBarcode(await detector.detect(video));
            if (sessionRef.current !== token) return;
            if (barcode) {
              stopScanner();
              setStatus("Barcode found. Looking up your food...");
              onDetected(barcode);
              return;
            }
          }
        } catch {
          // A blurry or unavailable frame can fail; retry on the next frame.
        }
        if (sessionRef.current === token) frameRef.current = requestAnimationFrame(scanFrame);
      };
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      stopScanner();
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setStatus("Camera access was denied. Allow camera permission or enter the barcode manually.");
      } else if (error?.name === "NotFoundError") {
        setStatus("No camera was found on this device. Enter the barcode manually.");
      } else {
        setStatus("Could not start the camera scanner. Try again or enter the barcode manually.");
      }
    }
  }

  return (
    <div className="tf-barcode-camera">
      <button
        className="tf-barcode-camera__button"
        type="button"
        onClick={scanning ? stopScanner : startScanner}
        disabled={disabled}
        aria-label={scanning ? "Stop barcode scanner" : "Scan food barcode with camera"}
      >
        {scanning ? <CameraOff size={19} /> : <ScanBarcode size={19} />}
        {scanning ? "Stop camera" : "Scan barcode"}
      </button>
      <div className={scanning ? "tf-barcode-camera__preview is-active" : "tf-barcode-camera__preview"}>
        <video ref={videoRef} muted playsInline autoPlay aria-label="Live barcode camera preview" />
        {scanning && <div className="tf-barcode-camera__target" aria-hidden="true"><Camera size={26} /></div>}
      </div>
      {scanning && <p className="tf-barcode-camera__instruction">Point your camera at the barcode on the packet. TrackFit will fill in the number automatically.</p>}
      {status && (status !== "Barcode found. Looking up your food..." || disabled) && <p role="status" className="tf-barcode-camera__status">{status}</p>}
    </div>
  );
}
