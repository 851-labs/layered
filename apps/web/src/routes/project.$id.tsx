import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";

import { HistorySidebar } from "../components/history-sidebar";
import { LayerPanel } from "../components/layer-panel";
import { LayerViewer3D } from "../components/layer-viewer-3d";
import { api } from "../lib/api";
import { type Blob } from "../lib/api/schema";

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
    <div className="h-[calc(100vh-56px)] flex bg-stone-50">
      {/* Left sidebar: History */}
      <HistorySidebar projects={projects} currentId={project.id} />

      {/* Center: 3D Viewer */}
      <div className="flex-1 flex items-center justify-center bg-stone-100/50">
        <LayerViewer3D layers={layers} className="w-full h-full" />
      </div>

      {/* Right sidebar: Layers */}
      <LayerPanel
        layers={layers}
        onToggleVisibility={handleToggleVisibility}
        onOpacityChange={handleOpacityChange}
      />
    </div>
  );
}

const Route = createFileRoute("/project/$id")({
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
