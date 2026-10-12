
import { useEffect, useState } from "react";

export default function KycDocumentCard({
  title,
  fileName,
  fileUrl,
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fileName || !fileUrl) return;

    const controller = new AbortController();
    let objectUrl = null;

    const loadDocument = async () => {
      setLoading(true);
      setError("");
      setBlobUrl(null);

      try {
        const response = await fetch(fileUrl, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load document (${response.status})`
          );
        }

        const blob = await response.blob();

        if (
          blob.type !== "application/pdf" &&
          !blob.type.startsWith("image/")
        ) {
          throw new Error("Unsupported document format");
        }

        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "Unable to load document");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileName, fileUrl]);

  if (!fileName || !fileUrl) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
        <p className="font-medium text-gray-800">
          {title}
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Document not uploaded
        </p>
      </div>
    );
  }

  const lowerFileName = fileName.toLowerCase();

  const isPdf = lowerFileName.endsWith(".pdf");

  const isImage =
    lowerFileName.endsWith(".jpg") ||
    lowerFileName.endsWith(".jpeg") ||
    lowerFileName.endsWith(".png") ||
    lowerFileName.endsWith(".webp");

  const displayName = fileName.split("/").pop();

  const handleDownload = () => {
    if (!blobUrl) return;

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = displayName || `${title}-document`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpen = () => {
    if (!blobUrl) return;

    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">
            {title}
          </p>

          <p className="mt-1 truncate text-xs text-gray-500">
            {displayName}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={!blobUrl}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!blobUrl}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex min-h-[280px] items-center justify-center bg-gray-50 p-4">
        {loading && (
          <p className="text-sm text-gray-500">
            Loading document...
          </p>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && blobUrl && isImage && (
          <img
            src={blobUrl}
            alt={title}
            className="max-h-[450px] max-w-full rounded-lg object-contain shadow-sm"
          />
        )}

        {!loading && !error && blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title={title}
            className="h-[450px] w-full rounded-lg border border-gray-200 bg-white"
          />
        )}

        {!loading &&
          !error &&
          blobUrl &&
          !isImage &&
          !isPdf && (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Preview not available
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Please use Open or Download.
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
