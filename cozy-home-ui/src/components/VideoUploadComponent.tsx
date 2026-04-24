import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadComponentProps {
  onUploadSuccess?: (data: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB, default 100
  storage?: "local" | "cloudinary"; // default 'local'
  requireAuth?: boolean; // if true, uses /api/upload/video/secure endpoint
  className?: string;
}

export const VideoUploadComponent: React.FC<VideoUploadComponentProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 100,
  storage = "local",
  requireAuth = false,
  className = "",
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFormats = [".mp4", ".mov", ".avi"];
  const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!allowedFormats.includes(fileExtension)) {
      const errorMsg = `Invalid file format. Only ${allowedFormats.join(", ")} are allowed.`;
      toast({
        title: "Invalid File",
        description: errorMsg,
        variant: "destructive",
      });
      onUploadError?.(errorMsg);
      setSelectedFile(null);
      return;
    }

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.type)) {
      const errorMsg = `Invalid file type: ${file.type}. Please select a video file.`;
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive",
      });
      onUploadError?.(errorMsg);
      setSelectedFile(null);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      const errorMsg = `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxFileSize}MB.`;
      toast({
        title: "File Too Large",
        description: errorMsg,
        variant: "destructive",
      });
      onUploadError?.(errorMsg);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);

      const endpoint = requireAuth
        ? `/api/upload/video/secure?storage=${storage}`
        : `/api/upload/video?storage=${storage}`;

      // Get API URL from environment or use current origin
      const API_URL =
        import.meta.env.VITE_API_URL ||
        `${window.location.protocol}//${window.location.host}`;

      const uploadUrl = `${API_URL}${endpoint}`;

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(progress);
        }
      });

      // Handle completion
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data) {
                toast({
                  title: "Success",
                  description: "Video uploaded successfully!",
                });
                onUploadSuccess?.(response.data);
                setSelectedFile(null);
                setUploadProgress(0);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                resolve();
              } else {
                reject(
                  new Error(
                    response.message ||
                      "Upload succeeded but response format is invalid"
                  )
                );
              }
            } catch (e) {
              reject(new Error("Failed to parse upload response"));
            }
          } else if (xhr.status === 413) {
            reject(
              new Error(
                `File too large (HTTP 413). Maximum size: ${maxFileSize}MB`
              )
            );
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  errorResponse.message ||
                    errorResponse.error ||
                    `Upload failed with status ${xhr.status}`
                )
              );
            } catch {
              reject(
                new Error(
                  `Upload failed with status ${xhr.status}. ${xhr.statusText}`
                )
              );
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(
            new Error(
              "Network error during upload. Please check your connection."
            )
          );
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was cancelled."));
        });

        // Get auth token if needed
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("accessToken");

        xhr.open("POST", uploadUrl, true);

        // Set authorization header if token exists
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        // Send the form data
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      console.error("Video upload error:", errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileSizeMB = selectedFile
    ? (selectedFile.size / (1024 * 1024)).toFixed(2)
    : "0";

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="space-y-4">
        {/* File Input */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedMimeTypes.join(",")}
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="video-input"
          />
          <label
            htmlFor="video-input"
            className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isUploading
                ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                : selectedFile
                  ? "bg-blue-50 border-blue-400"
                  : "bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <div className="flex flex-col items-center justify-center py-6">
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                {selectedFile ? selectedFile.name : "Click to upload video"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedFile
                  ? `${fileSizeMB}MB`
                  : `MP4, MOV, or AVI (Max ${maxFileSize}MB)`}
              </p>
            </div>
          </label>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Uploading...</p>
              <p className="text-sm font-bold text-blue-600">
                {uploadProgress}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* File Info */}
        {selectedFile && !isUploading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected:</span> {selectedFile.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Size: {fileSizeMB}MB
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
              !selectedFile || isUploading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isUploading ? `Uploading (${uploadProgress}%)` : "Upload Video"}
          </button>

          {selectedFile && !isUploading && (
            <button
              onClick={handleCancel}
              className="py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Supported formats: MP4, MOV, AVI • Maximum file size: {maxFileSize}MB
        </p>
      </div>
    </div>
  );
};

export default VideoUploadComponent;
