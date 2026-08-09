import { DataQualityBadge } from "@/components/data-quality-badge";
import { ExternalLink, Info } from "lucide-react";
import type { CostProfile } from "@shared/schema";

export function SourcePanel({ profile }: { profile: CostProfile }) {
  return (
    <div className="rounded-lg border border-card-border bg-card p-4 space-y-2" data-testid="panel-source">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="h-4 w-4 text-muted-foreground" />
          Source &amp; provenance
        </div>
        <DataQualityBadge quality={profile.dataQuality} />
      </div>
      {profile.sourceName && (
        <p className="text-sm text-muted-foreground">
          {profile.sourceUrl ? (
            <a
              href={profile.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground underline decoration-dotted hover:decoration-solid"
              data-testid="link-source-url"
            >
              {profile.sourceName}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            profile.sourceName
          )}
          {profile.sourceYear ? ` · ${profile.sourceYear}` : ""}
        </p>
      )}
      {profile.notes && (
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-source-notes">
          {profile.notes}
        </p>
      )}
    </div>
  );
}
