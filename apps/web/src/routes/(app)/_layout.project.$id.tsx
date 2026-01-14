import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";

import { api } from "../../lib/api";
import { type Blob } from "../../lib/api/schema";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../../ui/resizable";
import { HistorySidebar } from "./-components/history-sidebar";
import { LayerPanel } from "./-components/layer-panel";
import { LayerViewer3D } from "./-components/layer-viewer-3d";

type LayerState = {
  url: string;
  visible: boolean;
  opacity: number;
};

function ProjectPage() {
  const { id } = Route.useParams();
  const { data: project } = useSuspenseQuery(api.project.get.queryOptions({ id }));
  const { data: projectsData } = useSuspenseQuery(api.project.list.queryOptions());

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
    <ResizablePanelGroup orientation="horizontal" className="h-[calc(100vh-48px)]!">
      {/* Left sidebar: History */}
      <ResizablePanel minSize={200} defaultSize={240} maxSize={300}>
        <HistorySidebar projects={projectsData.projects} currentId={project.id} />
      </ResizablePanel>

      <ResizableHandle />

      {/* Center: 3D Viewer */}
      <ResizablePanel>
        <LayerViewer3D layers={layers} />
      </ResizablePanel>

      <ResizableHandle />

      {/* Right sidebar: Layers */}
      <ResizablePanel minSize={200} defaultSize={288} maxSize={300}>
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
  ssr: false,
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
