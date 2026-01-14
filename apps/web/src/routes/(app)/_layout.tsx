import { SignOutIcon } from "@phosphor-icons/react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

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
  const { data: session } = authClient.useSession();

  return (
    <header className="h-12 bg-white sticky top-0 z-50 flex flex-col">
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-800 tracking-tight">Layered</span>
        </Link>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer outline-none">
                <Avatar size="sm">
                  <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
                  <AvatarFallback>{session.user.name?.charAt(0) ?? "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={() => authClient.signOut()}>
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
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}

const Route = createFileRoute("/(app)/_layout")({
  component: AppLayout,
});

export { Route };
