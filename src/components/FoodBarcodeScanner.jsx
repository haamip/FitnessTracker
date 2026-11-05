import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ScanBarcode } from "lucide-react";
import { FOOD_BARCODE_FORMATS, readFoodBarcode } from "../services/foodBarcodeScanner";
import "./FoodBarcodeScanner.css";

/**
 * Prefer fast native BarcodeDetector, with a local ZXing fallback for Safari
 * and other browsers. Frames stay on the device; no image is uploaded.
 * Camera permission is requested only after the user taps Scan.
 */
export default function FoodBarcodeScanner({ onDetected, disabled = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerControlsRef = useRef(null);
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
    const controls = readerControlsRef.current;
    readerControlsRef.current = null;
    controls?.stop();
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
      setStatus("Camera scanning needs HTTPS and a browser with camera access. Open TrackFit in Safari or Chrome, or enter the barcode manually.");
      return;
    }

    stopScanner();
    const token = sessionRef.current + 1;
    sessionRef.current = token;

    try {
      // Some browsers expose BarcodeDetector but no food barcode formats.
      // If so, use the cross-browser decoder rather than blocking the user.
      let nativeDetector = null;
      if (typeof window.BarcodeDetector === "function") {
        try {
          const supported = typeof window.BarcodeDetector.getSupportedFormats === "function"
            ? await window.BarcodeDetector.getSupportedFormats()
            : FOOD_BARCODE_FORMATS;
          const formats = FOOD_BARCODE_FORMATS.filter((format) => supported.includes(format));
          if (formats.length) nativeDetector = new window.BarcodeDetector({ formats });
        } catch {
          // A broken native implementation is not a reason to reject Safari or Chrome.
        }
      }
      if (sessionRef.current !== token) return;

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
      await video.play();
      if (sessionRef.current !== token) return;
      setScanning(true);

      const detected = (code) => {
        if (sessionRef.current !== token || !code) return;
        stopScanner();
        setStatus("Barcode found. Looking up your food...");
        onDetected(code);
      };

      if (nativeDetector) {
        const scanFrame = async () => {
          if (sessionRef.current !== token) return;
          try {
            if (video.readyState >= 2) {
              const code = readFoodBarcode(await nativeDetector.detect(video));
              if (sessionRef.current !== token) return;
              if (code) {
                detected(code);
                return;
              }
            }
          } catch {
            // Blurry frames are common; retry until the user stops scanning.
          }
          if (sessionRef.current === token) frameRef.current = requestAnimationFrame(scanFrame);
        };
        frameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Safari/iOS does not implement BarcodeDetector. Load the decoder only
      // when needed so native Android scanning remains lightweight.
      const [{ BrowserMultiFormatOneDReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      if (sessionRef.current !== token) return;
      const hints = new Map([
        [DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
        ]],
      ]);
      const reader = new BrowserMultiFormatOneDReader(hints);
      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (!result || sessionRef.current !== token) return;
        const code = readFoodBarcode([{ rawValue: result.getText() }]);
        detected(code);
      });
      if (sessionRef.current !== token) {
        controls.stop();
        return;
      }
      readerControlsRef.current = controls;
    } catch (error) {
      if (sessionRef.current !== token) return;
      stopScanner();
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setStatus("Camera access was denied. Allow TrackFit camera permission in your browser settings, or type the barcode.");
      } else if (error?.name === "NotFoundError") {
        setStatus("No camera was found on this device. Enter the barcode manually.");
      } else {
        setStatus("Could not start the camera scanner. Open TrackFit directly in Safari or Chrome, then try again. You can also enter the barcode manually.");
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
