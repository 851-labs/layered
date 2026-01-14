import { createServerFn } from "@tanstack/react-start";

import { createQueryProcedure } from "../create-procedure";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const getFn = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
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
