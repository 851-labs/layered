import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { auth } from "../../auth/server";
import { db } from "../../db";
import { blobs, predictionBlobs, predictions, projects } from "../../db/schema";
import {
  createMutationProcedureWithInput,
  createQueryProcedure,
  createQueryProcedureWithInput,
} from "../create-procedure";
import { throwIfUnauthenticatedMiddleware } from "../middleware";
import { type Blob, type Project } from "../schema";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const IMAGE_ENDPOINT_ID = "fal-ai/qwen-image-layered";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type BlobWithRole = {
  id: string;
  contentType: string;
  width: number;
  height: number;
  role: "input" | "output";
};

function toPublicBlob(blob: Omit<BlobWithRole, "role">): Blob {
  return {
    id: blob.id,
    url: `${env.R2_PUBLIC_URL}/${blob.id}`,
    contentType: blob.contentType,
    width: blob.width,
    height: blob.height,
  };
}

// -----------------------------------------------------------------------------
// Server Functions
// -----------------------------------------------------------------------------

/**
 * Create a new project and trigger background generation workflow.
 * Returns immediately with project ID and status=processing.
 */
const createProject = createServerFn({ method: "POST" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .inputValidator(
    z.object({
      imageUrl: z.url(),
      inputBlobId: z.string(),
      layerCount: z.number().int().min(2).max(10).default(4),
    }),
  )
  .handler(async ({ data, context }): Promise<Project> => {
    const { imageUrl, inputBlobId, layerCount } = data;

    // Create project with processing status
    const [project] = await db
      .insert(projects)
      .values({ userId: context.session.user.id, status: "processing" })
      .returning({ id: projects.id, createdAt: projects.createdAt });

    // Create prediction placeholder (output will be populated by workflow)
    const [prediction] = await db
      .insert(predictions)
      .values({
        projectId: project.id,
        userId: context.session.user.id,
        endpointId: IMAGE_ENDPOINT_ID,
        input: JSON.stringify({ image_url: imageUrl, num_layers: layerCount }),
        output: JSON.stringify({}),
        status: "processing",
      })
      .returning({ id: predictions.id });

    // Link input blob to prediction
    await db.insert(predictionBlobs).values({
      predictionId: prediction.id,
      blobId: inputBlobId,
      role: "input",
      position: 0,
    });

    // Fetch the input blob data
    const inputBlobRow = await db
      .select({
        id: blobs.id,
        contentType: blobs.contentType,
        width: blobs.width,
        height: blobs.height,
      })
      .from(blobs)
      .where(eq(blobs.id, inputBlobId))
      .get();

    if (!inputBlobRow) throw new Error("Input blob not found");

    // Trigger background workflow
    await env.GENERATE_PROJECT_WORKFLOW.create({
      params: {
        projectId: project.id,
        predictionId: prediction.id,
        imageUrl,
        layerCount,
      },
    });

    return {
      id: project.id,
      name: null,
      status: "processing",
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: [],
      createdAt: project.createdAt,
    };
  });

/**
 * Get a single project by ID.
 */
const getProject = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Project> => {
    const project = await db.select().from(projects).where(eq(projects.id, data.id)).get();
    if (!project) throw new Error("Project not found");

    // Get the image prediction for this project
    const imagePrediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.projectId, project.id))
      .orderBy(asc(predictions.createdAt))
      .get();

    if (!imagePrediction) throw new Error("Image prediction not found");

    // Get blobs with full data via join
    const blobRows = await db
      .select({
        id: blobs.id,
        contentType: blobs.contentType,
        width: blobs.width,
        height: blobs.height,
        role: predictionBlobs.role,
      })
      .from(predictionBlobs)
      .innerJoin(blobs, eq(predictionBlobs.blobId, blobs.id))
      .where(eq(predictionBlobs.predictionId, imagePrediction.id))
      .orderBy(asc(predictionBlobs.position));

    const outputBlobRows = blobRows.filter((b) => b.role === "output");
    const inputBlobRow = blobRows.find((b) => b.role === "input");

    if (!inputBlobRow) throw new Error("Input blob not found");

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: project.status === "completed" ? outputBlobRows.map(toPublicBlob) : [],
      createdAt: project.createdAt,
    };
  });

/**
 * Get recent projects for the current user.
 */
const listProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ projects: Project[] }> => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return { projects: [] };
    }

    const projectRows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, session.user.id), isNotNull(projects.userId)))
      .orderBy(desc(projects.createdAt))
      .limit(6);

    const projectsWithData = await Promise.all(
      projectRows.map(async (project) => {
        const imagePrediction = await db
          .select()
          .from(predictions)
          .where(eq(predictions.projectId, project.id))
          .orderBy(asc(predictions.createdAt))
          .get();

        if (!imagePrediction) throw new Error(`Prediction not found for project ${project.id}`);

        const blobRows = await db
          .select({
            id: blobs.id,
            contentType: blobs.contentType,
            width: blobs.width,
            height: blobs.height,
            role: predictionBlobs.role,
          })
          .from(predictionBlobs)
          .innerJoin(blobs, eq(predictionBlobs.blobId, blobs.id))
          .where(eq(predictionBlobs.predictionId, imagePrediction.id))
          .orderBy(asc(predictionBlobs.position));

        const outputBlobRows = blobRows.filter((b) => b.role === "output");
        const inputBlobRow = blobRows.find((b) => b.role === "input");

        if (!inputBlobRow) throw new Error(`Input blob not found for project ${project.id}`);

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          inputBlob: toPublicBlob(inputBlobRow),
          outputBlobs: project.status === "completed" ? outputBlobRows.map(toPublicBlob) : [],
          createdAt: project.createdAt,
        };
      }),
    );

    return { projects: projectsWithData };
  },
);

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const projectRouter = {
  create: createMutationProcedureWithInput(["project", "create"], createProject),
  get: createQueryProcedureWithInput(["project"], getProject),
  list: createQueryProcedure(["projects"], listProjects),
};

export { projectRouter };
