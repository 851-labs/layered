import { SignOutIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useRouter } from "@tanstack/react-router";

import { useZoomLock } from "../../hooks/use-zoom-lock";
import { api } from "../../lib/api";
import { authClient } from "../../lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Separator } from "../../ui/separator";

function AppHeader() {
  const router = useRouter();
  const { data: user } = useSuspenseQuery(api.account.get.queryOptions());

  return (
    <header className="h-12 bg-white sticky top-0 z-50 flex flex-col">
      <div className="flex-1 w-full mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-800 tracking-tight">Layered</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer outline-none">
                <Avatar size="sm">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback>{user.name?.charAt(0) ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    authClient.signOut({
                      fetchOptions: { onSuccess: () => router.navigate({ to: "/" }) },
                    })
                  }
                >
                  <SignOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => authClient.signIn.social({ provider: "google" })}>
              Sign in
            </Button>
          )}
        </div>
      </div>
      <Separator />
    </header>
  );
}

function AppLayout() {
  useZoomLock();

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}

const Route = createFileRoute("/(app)/_layout")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(api.account.get.queryOptions());
  },
  component: AppLayout,
});

export { Route };
