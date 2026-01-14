import { createServerFn } from "@tanstack/react-start";

import { createQueryProcedure } from "../create-procedure";
import { optionalAuthMiddleware } from "../middleware";

const getFn = createServerFn({ method: "GET" })
  .middleware([optionalAuthMiddleware])
  .handler(async ({ context }) => {
    if (!context.session?.user) return null;
    const { user } = context.session;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  });

const accountRouter = {
  get: createQueryProcedure(["account"], getFn),
};

export { accountRouter };
