import { useEffect, useState } from "react";

import { getHealth } from "../api/health";
import { Layout } from "../components/layout";
import { Button, ErrorMessage } from "../components/shared";
import { StatusCard } from "../components/status/StatusCard";
import type { HealthResponse } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export function StatusPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadHealth = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const response = await getHealth();
      setData(response);
    } catch (loadError) {
      const friendlyError = getErrorMessage(loadError);
      setError(friendlyError.message);
      setErrorDetails(friendlyError.details ?? null);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <Layout>
      <section className="space-y-6">
        <div className="panel p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="pill bg-lagoon/10 text-lagoon">Live backend check</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">API status</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                This page calls the backend `GET /health` endpoint through the shared API client.
              </p>
            </div>
            <Button
              loading={isLoading}
              loadingLabel="Refreshing..."
              variant="secondary"
              onClick={() => void loadHealth()}
            >
              Refresh status
            </Button>
          </div>
        </div>

        {error ? (
          <ErrorMessage
            details={errorDetails ?? undefined}
            message={error}
            onRetry={() => void loadHealth()}
            title="Couldn't load API status"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            title="Reachability"
            value={isLoading ? "Checking..." : error ? "Offline" : "Connected"}
            description="Whether the frontend can successfully reach the backend health endpoint."
          />
          <StatusCard
            title="Service status"
            value={data?.status ?? "Unknown"}
            description="Current status field returned by the FastAPI backend."
          />
          <StatusCard
            title="API version"
            value={data?.version ?? "N/A"}
            description="Version reported by the backend package metadata."
          />
        </div>
      </section>
    </Layout>
  );
}
