// Extend the Cloudflare.Env interface with secrets from .dev.vars
declare namespace Cloudflare {
  interface Env {
    FAL_KEY: string;
    CF_AIG_TOKEN: string;
  }
}
