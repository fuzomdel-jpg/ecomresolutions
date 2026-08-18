/**
 * Future store-connection adapters.
 * V1 does not call marketplace APIs or mutate customer systems.
 */
export type PlatformConnection = {
  platformSlug: string;
  organizationId: string;
  status: "disconnected" | "connected" | "error";
};

export interface StoreConnector {
  connect(organizationId: string): Promise<PlatformConnection>;
  inspect(_connection: PlatformConnection): Promise<{
    critical: number;
    warnings: number;
    potentialFixes: number;
  }>;
}

export class UnimplementedConnector implements StoreConnector {
  constructor(private platformSlug: string) {}
  async connect(organizationId: string): Promise<PlatformConnection> {
    return { platformSlug: this.platformSlug, organizationId, status: "disconnected" };
  }
  async inspect() {
    return { critical: 0, warnings: 0, potentialFixes: 0 };
  }
}
