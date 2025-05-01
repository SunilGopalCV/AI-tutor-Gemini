"use client";

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, Undo, Redo, Palette, Upload } from "lucide-react";

interface MathCanvasProps {
  className?: string;
  onImageCapture?: (imageData: string) => void;
}

interface CanvasRef {
  getImageData: () => string;
  loadImage: (file: File) => Promise<void>;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

const MathCanvas = forwardRef<CanvasRef, MathCanvasProps>(
  ({ className, onImageCapture }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(3);
    const [mode, setMode] = useState<"pen" | "eraser">("pen");
    const [history, setHistory] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastCaptureTimeRef = useRef(0);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;

      const context = canvas.getContext("2d");
      if (!context) return;

      context.scale(2, 2);
      context.lineCap = "round";
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      contextRef.current = context; // Save initial state

      saveHistoryState(); // Start periodic capture for sending to Gemini

      startAutomaticCapture();

      return () => {
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
          captureIntervalRef.current = null;
        }
      };
    }, []); // Start automatic capture for sending to Gemini

    const startAutomaticCapture = () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }

      captureIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastCapture = now - lastCaptureTimeRef.current; // Only capture if it's been at least 2 seconds since the last capture
        if (timeSinceLastCapture >= 2000) {
          const imageData = getImageData();
          if (onImageCapture && imageData) {
            onImageCapture(imageData);
            lastCaptureTimeRef.current = now;
          }
        }
      }, 2000);
    };

    useEffect(() => {
      if (!contextRef.current) return;

      if (mode === "pen") {
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = brushSize;
      } else {
        contextRef.current.strokeStyle = "#FFFFFF";
        contextRef.current.lineWidth = brushSize * 3;
      }
    }, [color, brushSize, mode]);

    const startDrawing = ({
      nativeEvent,
    }: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !contextRef.current) return;

      const { offsetX, offsetY } =
        nativeEvent instanceof MouseEvent
          ? nativeEvent
          : {
              offsetX:
                (nativeEvent as TouchEvent).touches[0].clientX -
                canvas.getBoundingClientRect().left,
              offsetY:
                (nativeEvent as TouchEvent).touches[0].clientY -
                canvas.getBoundingClientRect().top,
            };

      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    };

    const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !contextRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const { offsetX, offsetY } =
        nativeEvent instanceof MouseEvent
          ? nativeEvent
          : {
              offsetX:
                (nativeEvent as TouchEvent).touches[0].clientX -
                canvas.getBoundingClientRect().left,
              offsetY:
                (nativeEvent as TouchEvent).touches[0].clientY -
                canvas.getBoundingClientRect().top,
            };

      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    };

    const finishDrawing = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
      saveHistoryState();
    };

    const saveHistoryState = () => {
      if (!canvasRef.current || !contextRef.current) return;

      const imageData = contextRef.current.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      setHistory((prev) => [...prev, imageData]);
      setRedoStack([]);
    };

    const loadImage = async (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!canvasRef.current || !contextRef.current) {
          reject(new Error("Canvas not initialized"));
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            if (!canvasRef.current || !contextRef.current) return;

            contextRef.current.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            ); // Calculate dimensions to fit the image while preserving aspect ratio

            const canvas = canvasRef.current;
            const ctx = contextRef.current;

            const ratio = Math.min(
              canvas.width / (2 * img.width),
              canvas.height / (2 * img.height)
            );

            const centerX = (canvas.width / 2 - img.width * ratio) / 2;
            const centerY = (canvas.height / 2 - img.height * ratio) / 2;

            ctx.drawImage(
              img,
              centerX,
              centerY,
              img.width * ratio,
              img.height * ratio
            );

            saveHistoryState(); // Capture the image after loading
            if (onImageCapture) {
              const imageData = getImageData();
              onImageCapture(imageData);
              lastCaptureTimeRef.current = Date.now();
            }
            resolve();
          };
          img.onerror = () => {
            reject(new Error("Failed to load image"));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      });
    };

    const clearCanvas = () => {
      if (!canvasRef.current || !contextRef.current) return;

      contextRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      saveHistoryState(); // Capture the cleared canvas
      if (onImageCapture) {
        const imageData = getImageData();
        onImageCapture(imageData);
        lastCaptureTimeRef.current = Date.now();
      }
    };

    const undo = () => {
      if (history.length <= 1 || !canvasRef.current || !contextRef.current)
        return;

      const lastState = history[history.length - 2];
      const currentState = history[history.length - 1];

      setRedoStack((prev) => [...prev, currentState]);
      setHistory((prev) => prev.slice(0, -1));

      contextRef.current.putImageData(lastState, 0, 0); // Capture after undo
      if (onImageCapture) {
        const imageData = getImageData();
        onImageCapture(imageData);
        lastCaptureTimeRef.current = Date.now();
      }
    };

    const redo = () => {
      if (redoStack.length === 0 || !canvasRef.current || !contextRef.current)
        return;

      const nextState = redoStack[redoStack.length - 1];

      setHistory((prev) => [...prev, nextState]);
      setRedoStack((prev) => prev.slice(0, -1));

      contextRef.current.putImageData(nextState, 0, 0); // Capture after redo
      if (onImageCapture) {
        const imageData = getImageData();
        onImageCapture(imageData);
        lastCaptureTimeRef.current = Date.now();
      }
    };

    const getImageData = (): string => {
      if (!canvasRef.current) return "";
      return canvasRef.current.toDataURL("image/png");
    };

    useImperativeHandle(ref, () => ({
      getImageData,
      loadImage,
      clearCanvas,
      undo,
      redo,
    }));

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setColor(e.target.value);
      setMode("pen");
    };

    const handleImageUpload = () => {
      fileInputRef.current?.click();
    };

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await loadImage(file);
        } catch (error) {
          console.error("Error loading image:", error);
        }
      }
    };

    return (
      <div className="flex flex-col h-full">
               {" "}
        <div className="flex justify-center space-x-2 mb-2">
                   {" "}
          <Button
            size="sm"
            variant={mode === "pen" ? "default" : "outline"}
            onClick={() => setMode("pen")}
            className="px-2"
          >
                        <Palette className="h-4 w-4 mr-1" /> Pen          {" "}
          </Button>
                   {" "}
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
          />
                   {" "}
          <Button
            size="sm"
            variant={mode === "eraser" ? "default" : "outline"}
            onClick={() => setMode("eraser")}
            className="px-2"
          >
                        <Eraser className="h-4 w-4 mr-1" /> Eraser          {" "}
          </Button>
                   {" "}
          <Button
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={history.length <= 1}
            className="px-2"
          >
                        <Undo className="h-4 w-4" />         {" "}
          </Button>
                   {" "}
          <Button
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="px-2"
          >
                        <Redo className="h-4 w-4" />         {" "}
          </Button>
                   {" "}
          <Button
            size="sm"
            variant="outline"
            onClick={clearCanvas}
            className="px-2"
          >
                        <Trash2 className="h-4 w-4" />         {" "}
          </Button>
                   {" "}
          <Button
            size="sm"
            variant="outline"
            onClick={handleImageUpload}
            className="px-2"
          >
                        <Upload className="h-4 w-4 mr-1" /> Upload Problem      
               {" "}
          </Button>
                   {" "}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelected}
            accept="image/*"
            className="hidden"
          />
                 {" "}
        </div>
               {" "}
        <div className="flex-1 relative">
                   {" "}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={finishDrawing}
            onMouseLeave={finishDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={finishDrawing}
            className={`w-full h-full border border-gray-200 rounded-md bg-white touch-none ${
              className || ""
            }`}
          />
                 {" "}
        </div>
             {" "}
      </div>
    );
  }
);

MathCanvas.displayName = "MathCanvas";

export default MathCanvas;
