"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  isPublished: boolean;
  authorName: string | null;
  createdAtLabel: string;
  expiresAtLabel: string | null;
};

const initialForm = {
  title: "",
  body: "",
  type: "info",
  audience: "all"
};

function getAnnouncementVariant(type: string) {
  if (type === "critical") return "destructive" as const;
  if (type === "warning") return "secondary" as const;
  return "default" as const;
}

export function AdminAnnouncementsPanel({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [formValues, setFormValues] = useState(initialForm);

  async function createAnnouncement() {
    setPendingKey("create");
    try {
      await csrfFetch<{ announcement: { id: string } }>("/api/admin/announcements", {
        method: "POST",
        body: {
          ...formValues,
          isPublished: false
        }
      });
      toast.success("Announcement created.");
      setFormValues(initialForm);
      setShowCreateForm(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to create announcement.";
      toast.error(message);
    } finally {
      setPendingKey(null);
    }
  }

  async function mutateAnnouncement(
    key: string,
    init: Omit<RequestInit, "body"> & { body?: Record<string, unknown> | Array<unknown> | BodyInit | null },
    successMessage: string
  ) {
    setPendingKey(key);
    try {
      await csrfFetch<Record<string, unknown>>("/api/admin/announcements", init);
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to update announcement.";
      toast.error(message);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" onClick={() => setShowCreateForm((open) => !open)}>
          {showCreateForm ? "Close Form" : "Create Announcement"}
        </Button>
      </div>

      {showCreateForm ? (
        <Card>
          <CardContent className="grid gap-4 p-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={formValues.title}
                onChange={(event) => setFormValues((current) => ({ ...current, title: event.target.value }))}
                placeholder="Announcement title"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="announcement-body">Body</Label>
              <Textarea
                id="announcement-body"
                value={formValues.body}
                onChange={(event) => setFormValues((current) => ({ ...current, body: event.target.value }))}
                placeholder="Share the update with platform users."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-type">Type</Label>
              <Select
                id="announcement-type"
                value={formValues.type}
                onChange={(event) => setFormValues((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="info">info</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-audience">Audience</Label>
              <Select
                id="announcement-audience"
                value={formValues.audience}
                onChange={(event) => setFormValues((current) => ({ ...current, audience: event.target.value }))}
              >
                <option value="all">all</option>
                <option value="retailers">retailers</option>
                <option value="suppliers">suppliers</option>
                <option value="customers">customers</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                disabled={pendingKey === "create" || !formValues.title.trim() || !formValues.body.trim()}
                onClick={() => void createAnnouncement()}
              >
                {pendingKey === "create" ? "Creating..." : "Save Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No announcements yet.
          </CardContent>
        </Card>
      ) : null}

      {announcements.map((announcement) => {
        const publishKey = `publish-${announcement.id}`;
        const deleteKey = `delete-${announcement.id}`;
        const isBusy = [publishKey, deleteKey].includes(pendingKey ?? "");

        return (
          <Card key={announcement.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <Badge variant={getAnnouncementVariant(announcement.type)}>{announcement.type}</Badge>
                    <Badge variant="outline">{announcement.audience}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{`By: ${announcement.authorName ?? "System"}`}</span>
                    <span>{`Created: ${announcement.createdAtLabel}`}</span>
                    {announcement.expiresAtLabel ? <span>{`Expires: ${announcement.expiresAtLabel}`}</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={announcement.isPublished ? "default" : "outline"}>
                    {announcement.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() =>
                      void mutateAnnouncement(
                        publishKey,
                        {
                          method: "PATCH",
                          body: {
                            announcementId: announcement.id,
                            isPublished: !announcement.isPublished
                          }
                        },
                        announcement.isPublished ? "Announcement unpublished." : "Announcement published."
                      )
                    }
                  >
                    {announcement.isPublished ? "Unpublish" : "Publish"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" size="sm" variant="destructive" disabled={isBusy}>
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete announcement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete {announcement.title}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() =>
                            void mutateAnnouncement(
                              deleteKey,
                              {
                                method: "DELETE",
                                body: {
                                  announcementId: announcement.id
                                }
                              },
                              "Announcement deleted."
                            )
                          }
                          disabled={isBusy}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
