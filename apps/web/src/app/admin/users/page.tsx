"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Users as UsersIcon } from "lucide-react";
import type { Role, UserStatus } from "@synergi/shared-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { useAdminUsers, useUpdateAdminUserStatus } from "@/features/admin/hooks";
import { UserStatusBadge } from "@/features/admin/components/status-badges";

const STATUS_OPTIONS: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"];

function initialsOf(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminUsers({ page, role, status, search: search || undefined });
  const updateStatus = useUpdateAdminUserStatus();

  return (
    <div>
      <PageHeader title="Users" description="Manage client, professional, and admin accounts." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>

        <Select
          value={role ?? "all"}
          onValueChange={(value) => {
            setRole(value === "all" ? undefined : (value as Role));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status ?? "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? undefined : (value as UserStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && data && data.items.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users found" description="Try a different filter." />
      )}

      <div className="grid gap-3">
        {data?.items.map((user) => (
          <Card key={user.id} className="p-4">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initialsOf(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{user.role}</span>
                <UserStatusBadge status={user.status} />
                <Select
                  value={user.status}
                  onValueChange={(value) =>
                    updateStatus.mutate({ id: user.id, status: value as UserStatus })
                  }
                >
                  <SelectTrigger className="w-40" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0) + option.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
