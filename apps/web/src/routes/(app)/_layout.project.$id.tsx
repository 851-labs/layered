import { CircleNotchIcon } from "@phosphor-icons/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import ms from "ms";
import { useCallback, useEffect, useState } from "react";

import { api } from "../../lib/api";
import { type Blob, type Project } from "../../lib/api/schema";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../ui/resizable";
import { HistorySidebar } from "./-components/history-sidebar";
import { LayerPanel } from "./-components/layer-panel";
import { LayerViewer3D } from "./-components/layer-viewer-3d";

type LayerState = {
  url: string;
  visible: boolean;
  opacity: number;
};

function CenterContent({ project, layers }: { project: Project; layers: LayerState[] }) {
  if (project.status === "processing") {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <img
              src={project.inputBlob.url}
              alt="Processing"
              className="w-64 h-64 object-contain opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <CircleNotchIcon className="w-12 h-12 text-stone-600 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-stone-600 font-medium">Generating layers...</p>
            <p className="text-sm text-stone-400 mt-1">This usually takes 10-15 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (project.status === "failed") {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Generation failed</p>
          <p className="text-sm text-stone-400 mt-1">Please try uploading your image again</p>
        </div>
      </div>
    );
  }

  return <LayerViewer3D layers={layers} />;
}

function ProjectPage() {
  const { id } = Route.useParams();
  const { data: project } = useQuery({
    ...api.project.get.queryOptions({ id }),
    refetchInterval: (query) => (query.state.data?.status === "processing" ? ms("1s") : false),
  });
  const { data: projectsData } = useSuspenseQuery(api.project.list.queryOptions());

  const [layers, setLayers] = useState<LayerState[]>([]);

  // Sync layers when project data changes (e.g., when processing completes)
  useEffect(() => {
    if (project?.status === "completed" && project.outputBlobs.length > 0) {
      setLayers(
        project.outputBlobs.map((blob: Blob) => ({
          url: blob.url,
          visible: true,
          opacity: 1,
        })),
      );
    }
  }, [project?.status, project?.outputBlobs]);

  const handleToggleVisibility = useCallback((index: number) => {
    setLayers((prev) =>
      prev.map((layer, i) => (i === index ? { ...layer, visible: !layer.visible } : layer)),
    );
  }, []);

  const handleOpacityChange = useCallback((index: number, opacity: number) => {
    setLayers((prev) => prev.map((layer, i) => (i === index ? { ...layer, opacity } : layer)));
  }, []);

  if (!project) {
    return null;
  }

  const isProcessing = project.status !== "completed";

  return (
    <ClientOnly>
      <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-48px)]!">
        {/* Left sidebar: History */}
        <ResizablePanel minSize={200} defaultSize={240} maxSize={300}>
          <HistorySidebar projects={projectsData.projects} currentId={project.id} />
        </ResizablePanel>

        <ResizableHandle />

        {/* Center: 3D Viewer or Loading State */}
        <ResizablePanel>
          <CenterContent project={project} layers={layers} />
        </ResizablePanel>

        <ResizableHandle />

        {/* Right sidebar: Layers (hidden while processing) */}
        <ResizablePanel minSize={200} defaultSize={288} maxSize={300}>
          {isProcessing ? (
            <div className="h-full bg-stone-50" />
          ) : (
            <LayerPanel
              layers={layers}
              onToggleVisibility={handleToggleVisibility}
              onOpacityChange={handleOpacityChange}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </ClientOnly>
  );
}

const Route = createFileRoute("/(app)/_layout/project/$id")({
  loader: async ({ params, context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(api.project.get.queryOptions({ id: params.id })),
      queryClient.ensureQueryData(api.project.list.queryOptions()),
    ]);
  },
  component: function ProjectPageWrapper() {
    const { id } = Route.useParams();
    return <ProjectPage key={id} />;
  },
});

export { Route };
