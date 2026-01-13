import { CircleNotchIcon, PlusIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";

import { api } from "../lib/api";
import { type Project } from "../lib/api/schema";
import { Button } from "../ui/button";
import { cn } from "../utils/cn";

const SUPPORTED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type SupportedContentType = (typeof SUPPORTED_CONTENT_TYPES)[number];

function isSupportedContentType(type: string): type is SupportedContentType {
  return SUPPORTED_CONTENT_TYPES.includes(type as SupportedContentType);
}

type HistorySidebarProps = {
  projects: Project[];
  currentId: string;
};

function HistorySidebar({ projects, currentId }: HistorySidebarProps) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleNewClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate content type
      if (!isSupportedContentType(file.type)) {
        console.error(`Unsupported image format: ${file.type || "unknown"}`);
        return;
      }

      setIsUploading(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { blobId, url } = await api.upload.image({
          data: {
            base64,
            contentType: file.type,
            fileName: file.name,
          },
        });

        const result = await api.project.create({
          data: { imageUrl: url, inputBlobId: blobId },
        });
        void navigate({ to: "/project/$id", params: { id: result.id } });
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  }, [navigate]);

  return (
    <div className="w-60 border-r border-stone-200 bg-stone-50 flex flex-col h-full">
      {/* Header with New button */}
      <div className="p-3 border-b border-stone-200">
        <Button onClick={handleNewClick} disabled={isUploading} className="w-full">
          {isUploading ? (
            <CircleNotchIcon className="animate-spin" data-icon="inline-start" />
          ) : (
            <PlusIcon data-icon="inline-start" />
          )}
          {isUploading ? "Processing..." : "New"}
        </Button>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.map((project) => {
          const isActive = project.id === currentId;

          return (
            <Link
              key={project.id}
              to="/project/$id"
              params={{ id: project.id }}
              className={cn(
                "block p-2 rounded-lg transition-colors",
                isActive ? "bg-stone-200" : "hover:bg-stone-100",
              )}
            >
              <div className="aspect-video rounded overflow-hidden bg-stone-200 mb-2">
                {project.inputBlob && (
                  <img
                    src={project.inputBlob.url}
                    alt={project.name ?? `Project ${project.id.slice(0, 8)}`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-600 truncate">
                  {project.name ?? project.id.slice(0, 8)}
                </span>
                <span className="text-xs text-stone-400">{project.outputBlobs.length} layers</span>
              </div>
            </Link>
          );
        })}

        {projects.length === 0 && (
          <div className="text-center py-8 text-sm text-stone-400">No projects yet</div>
        )}
      </div>
    </div>
  );
}

export { HistorySidebar };
