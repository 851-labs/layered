import { GithubLogoIcon } from "@phosphor-icons/react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { authClient } from "../../lib/auth/client";
import { Separator } from "../../ui/separator";

function MarketingHeader() {
  const { data: session } = authClient.useSession();

  return (
    <header className="h-14 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-50 flex flex-col">
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-stone-800 tracking-tight">Layered</span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/851-labs/layered"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 -m-2 text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="GitHub"
          >
            <GithubLogoIcon className="w-5 h-5" />
          </a>

          {session?.user ? (
            <Link
              to="/project/$id"
              params={{ id: "latest" }}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <button
              onClick={() => authClient.signIn.social({ provider: "google" })}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
      <Separator />
    </header>
  );
}

function MarketingLayout() {
  return (
    <>
      <MarketingHeader />
      <Outlet />
    </>
  );
}

const Route = createFileRoute("/(marketing)/_layout")({
  component: MarketingLayout,
});

export { Route };
