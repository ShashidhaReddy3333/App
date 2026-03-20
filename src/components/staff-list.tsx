"use client";

import { SearchFilter } from "@/components/search-filter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StaffCard = {
  id: string;
  fullName: string;
  email: string;
  roleLabel: string;
  status: string;
};

function getRoleBadgeVariant(role: string): "default" | "success" | "warning" | "secondary" {
  if (role.includes("owner")) return "success";
  if (role.includes("manager")) return "default";
  if (role.includes("cashier")) return "warning";
  return "secondary";
}

export function StaffList({ cards }: { cards: StaffCard[] }) {
  return (
    <SearchFilter data={cards} searchKey="fullName" placeholder="Search staff...">
      {(filtered) => (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground md:col-span-2">No staff match your search.</p>
          ) : null}
          {filtered.map((user) => (
            <Card key={user.id} className="gradient-panel transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.roleLabel)}>
                    {user.roleLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <Badge variant={user.status === "active" ? "success" : "secondary"}>
                  {user.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </SearchFilter>
  );
}
