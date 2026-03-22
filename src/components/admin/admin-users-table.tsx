"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  businessName: string | null;
  joinedAtLabel: string;
};

const roleOptions = [
  "owner",
  "manager",
  "cashier",
  "supplier",
  "customer",
  "platform_admin",
  "inventory_staff",
] as const;

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [roleValues, setRoleValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setRoleValues(Object.fromEntries(users.map((user) => [user.id, user.role])));
  }, [users]);

  async function mutateUser(key: string, payload: Record<string, unknown>, successMessage: string) {
    setPendingKey(key);
    try {
      await csrfFetch<{ user: { id: string } }>("/api/admin/users", {
        method: "PATCH",
        body: payload,
      });
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to update user.";
      toast.error(message);
      throw error;
    } finally {
      setPendingKey(null);
    }
  }

  async function changeRole(user: UserRow, nextRole: string) {
    const previousRole = roleValues[user.id] ?? user.role;
    setRoleValues((current) => ({ ...current, [user.id]: nextRole }));

    try {
      await mutateUser(
        `role-${user.id}`,
        { userId: user.id, role: nextRole },
        `${user.fullName}'s role updated.`
      );
    } catch {
      setRoleValues((current) => ({ ...current, [user.id]: previousRole }));
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Business</th>
            <th className="px-4 py-3 text-left font-medium">Joined</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const deactivateKey = `deactivate-${user.id}`;
            const reactivateKey = `reactivate-${user.id}`;
            const roleKey = `role-${user.id}`;
            const isBusy = [deactivateKey, reactivateKey, roleKey].includes(pendingKey ?? "");
            const roleValue = roleValues[user.id] ?? user.role;

            return (
              <tr key={user.id} className="border-b align-top hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{user.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    <Select
                      className="min-w-[170px]"
                      value={roleValue}
                      disabled={isBusy}
                      onChange={(event) => void changeRole(user, event.target.value)}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </Select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      user.status === "active"
                        ? "default"
                        : user.status === "suspended"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.businessName ?? "-"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{user.joinedAtLabel}</td>
                <td className="px-4 py-3">
                  {user.status === "active" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" size="sm" variant="destructive" disabled={isBusy}>
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate user</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deactivate {user.fullName}? This will suspend account access until an
                            admin reactivates the user.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={() =>
                              void mutateUser(
                                deactivateKey,
                                { userId: user.id, status: "suspended" },
                                `${user.fullName} deactivated.`
                              )
                            }
                            disabled={isBusy}
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() =>
                        void mutateUser(
                          reactivateKey,
                          { userId: user.id, status: "active" },
                          `${user.fullName} reactivated.`
                        )
                      }
                    >
                      {user.status === "invited" ? "Activate" : "Reactivate"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
