import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";

import { HistorySidebar } from "../../components/history-sidebar";
import { LayerPanel } from "../../components/layer-panel";
import { LayerViewer3D } from "../../components/layer-viewer-3d";
import { api } from "../../lib/api";
import { type Blob } from "../../lib/api/schema";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../../ui/resizable";

type LayerState = {
  url: string;
  visible: boolean;
  opacity: number;
};

function ProjectPage() {
  const { project, projects } = Route.useLoaderData();

  const [layers, setLayers] = useState<LayerState[]>(() =>
    project.outputBlobs.map((blob: Blob) => ({
      url: blob.url,
      visible: true,
      opacity: 1,
    })),
  );

  const handleToggleVisibility = useCallback((index: number) => {
    setLayers((prev) =>
      prev.map((layer, i) => (i === index ? { ...layer, visible: !layer.visible } : layer)),
    );
  }, []);

  const handleOpacityChange = useCallback((index: number, opacity: number) => {
    setLayers((prev) => prev.map((layer, i) => (i === index ? { ...layer, opacity } : layer)));
  }, []);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-48px)] bg-stone-50">
      {/* Left sidebar: History */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
        <HistorySidebar projects={projects} currentId={project.id} />
      </ResizablePanel>

      <ResizableHandle />

      {/* Center: 3D Viewer */}
      <ResizablePanel defaultSize={60}>
        <div className="flex items-center justify-center bg-stone-50 h-full">
          <LayerViewer3D layers={layers} className="w-full h-full" />
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {/* Right sidebar: Layers */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
        <LayerPanel
          layers={layers}
          onToggleVisibility={handleToggleVisibility}
          onOpacityChange={handleOpacityChange}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

const Route = createFileRoute("/(app)/_layout/project/$id")({
  loader: async ({ params }) => {
    const [project, { projects }] = await Promise.all([
      api.project.get({ data: { id: params.id } }),
      api.project.list(),
    ]);
    return { project, projects };
  },
  component: function ProjectPageWrapper() {
    const { project } = Route.useLoaderData();
    return <ProjectPage key={project.id} />;
  },
});

export { Route };
