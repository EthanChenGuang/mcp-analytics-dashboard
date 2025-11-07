import { ServerType } from '@/lib/types/analytics';

interface Server {
  packages?: unknown[];
  remotes?: unknown[];
}

export function classifyServer(server: Server): ServerType {
  const hasPackages = server.packages && server.packages.length > 0;
  const hasRemotes = server.remotes && server.remotes.length > 0;
  
  if (hasPackages && hasRemotes) return 'both';
  if (hasPackages) return 'local';
  if (hasRemotes) return 'remote';
  return 'unknown';
}




