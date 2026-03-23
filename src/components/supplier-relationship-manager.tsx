import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RelationshipSummary = {
  id: string;
  supplierName: string;
  businessName: string;
  productsCount: number;
  ordersCount: number;
  openOrdersCount: number;
};

function buildRelationshipHref(basePath: string, relationshipId?: string) {
  if (!relationshipId) {
    return basePath;
  }

  return `${basePath}?relationship=${encodeURIComponent(relationshipId)}`;
}

export function SupplierRelationshipManager({
  basePath,
  relationships,
  activeRelationshipId,
  showingAllRelationships,
  title = "Retailer relationships",
  description = "Review linked retailer businesses and focus the current view on one relationship when needed.",
}: {
  basePath: string;
  relationships: RelationshipSummary[];
  activeRelationshipId?: string | null;
  showingAllRelationships?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button asChild size="sm" variant={showingAllRelationships ? "default" : "outline"}>
            <a href={buildRelationshipHref(basePath)}>All relationships</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {relationships.map((relationship) => {
          const isActive = !showingAllRelationships && activeRelationshipId === relationship.id;

          return (
            <div
              key={relationship.id}
              className={`rounded-2xl border p-4 ${
                isActive
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/40 bg-[hsl(var(--surface-lowest))]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground">{relationship.businessName}</div>
                  <div className="text-sm text-muted-foreground">{relationship.supplierName}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isActive ? "default" : "outline"}>
                    {isActive ? "Focused" : "Linked"}
                  </Badge>
                  <Button asChild size="sm" variant={isActive ? "outline" : "default"}>
                    <a href={buildRelationshipHref(basePath, relationship.id)}>
                      {isActive ? "Viewing this relationship" : "Focus relationship"}
                    </a>
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{relationship.productsCount} products</span>
                <span>{relationship.ordersCount} orders</span>
                <span>{relationship.openOrdersCount} open</span>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          Need another retailer relationship? Ask the retailer to add this supplier using the same
          organization email, or have a platform admin link the account.
        </p>
      </CardContent>
    </Card>
  );
}
