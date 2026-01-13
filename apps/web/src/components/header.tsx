import { GithubLogoIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { authClient } from "../lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="h-14 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
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
            <Avatar>
              <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
              <AvatarFallback>{session.user.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
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
    </header>
  );
}

export { Header };
