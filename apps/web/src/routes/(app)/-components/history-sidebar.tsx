import {
  CircleNotchIcon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";

import { api } from "@/lib/api";
import { type Project } from "@/lib/api/schema";
import { authClient } from "@/lib/auth/client";
import { Alert, AlertTitle } from "@/ui/alert";
import { Button } from "@/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/ui/button-group";
import { Input } from "@/ui/input";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { cn } from "@/utils/cn";

const SUPPORTED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type SupportedContentType = (typeof SUPPORTED_CONTENT_TYPES)[number];

const MIN_LAYERS = 2;
const MAX_LAYERS = 8;
const DEFAULT_LAYERS = 4;

function isSupportedContentType(type: string): type is SupportedContentType {
  return SUPPORTED_CONTENT_TYPES.includes(type as SupportedContentType);
}

type HistorySidebarProps = {
  projects: Project[];
  currentId: string;
};

function HistorySidebar({ projects, currentId }: HistorySidebarProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [layerCount, setLayerCount] = useState(DEFAULT_LAYERS);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback(() => {
    if (isGenerating) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!isSupportedContentType(file.type)) {
        setError("Unsupported image format");
        return;
      }

      setError(null);
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }, [isGenerating]);

  const handleClearImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedFile || isGenerating) return;

    if (!session?.user) {
      void authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.pathname,
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const { blobId, url } = await api.upload.image.mutate({
        base64,
        contentType: selectedFile.type as SupportedContentType,
        fileName: selectedFile.name,
      });

      const result = await api.project.create.mutate({
        imageUrl: url,
        inputBlobId: blobId,
        layerCount,
      });

      // Reset form after successful generation
      setSelectedFile(null);
      setPreview(null);
      setLayerCount(DEFAULT_LAYERS);

      void navigate({ to: "/project/$id", params: { id: result.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed. Please try again.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFile, layerCount, navigate, isGenerating, session]);

  return (
    <div className="bg-white flex flex-col h-full">
      {/* New Project Form */}
      <div className="p-3 space-y-3">
        {/* Image Selector */}
        <div
          onClick={handleImageSelect}
          className={cn(
            "relative aspect-video border border-stone-300 transition-all cursor-pointer overflow-hidden",
            preview
              ? "bg-stone-100"
              : "border-dashed bg-stone-50 hover:border-stone-400 hover:bg-stone-100",
            isGenerating && "opacity-50 cursor-not-allowed",
          )}
        >
          {preview ? (
            <>
              <img src={preview} alt="Selected" className="w-full h-full object-contain" />
              {!isGenerating && (
                <button
                  onClick={handleClearImage}
                  className="absolute top-1 right-1 p-1 bg-stone-800/80 text-white hover:bg-stone-900 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <ImageIcon className="w-6 h-6 text-stone-400" />
              <span className="text-xs text-stone-500">Click to upload</span>
            </div>
          )}
        </div>

        {/* Layer Count */}
        <ButtonGroup className="w-full">
          <ButtonGroupText>Layers</ButtonGroupText>
          <Input
            type="number"
            min={MIN_LAYERS}
            max={MAX_LAYERS}
            value={layerCount}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                setLayerCount(Math.max(MIN_LAYERS, Math.min(MAX_LAYERS, val)));
              }
            }}
            disabled={isGenerating}
            className="tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLayerCount((prev) => Math.max(MIN_LAYERS, prev - 1))}
            disabled={layerCount <= MIN_LAYERS || isGenerating}
          >
            <MinusIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLayerCount((prev) => Math.min(MAX_LAYERS, prev + 1))}
            disabled={layerCount >= MAX_LAYERS || isGenerating}
          >
            <PlusIcon />
          </Button>
        </ButtonGroup>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedFile || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <CircleNotchIcon className="animate-spin" data-icon="inline-start" />
          ) : null}
          {isGenerating ? "Generating..." : "Generate"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
      </div>
      <Separator />

      {/* History header */}
      <div className="px-4 py-3">
        <h2 className="text-xs font-medium text-stone-700">History</h2>
      </div>
      <Separator />

      {/* Projects list */}
      <ScrollArea className="flex-1 min-h-0">
        {projects.map((project) => {
          const isActive = project.id === currentId;

          return (
            <div key={project.id}>
              <Link
                to="/project/$id"
                params={{ id: project.id }}
                className={cn(
                  "block p-3 transition-colors",
                  isActive ? "bg-stone-100" : "hover:bg-stone-100",
                )}
              >
                <div className="aspect-video overflow-hidden bg-stone-200 mb-2">
                  {project.inputBlob && (
                    <img
                      src={project.inputBlob.url}
                      alt={project.name ?? `Project ${project.id.slice(0, 8)}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-stone-600 truncate">
                    {project.name ?? project.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-stone-400 shrink-0 whitespace-nowrap">
                    {project.outputBlobs.length} layers
                  </span>
                </div>
              </Link>
              <Separator />
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="text-center py-8 text-sm text-stone-400">No projects yet</div>
        )}
      </ScrollArea>
    </div>
  );
}

export { HistorySidebar };
