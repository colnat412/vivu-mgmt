"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Heading,
  Avatar,
  Status,
  Loading,
  ErrorState,
  Empty,
  SearchField,
  Pagination,
} from "@/base/components/layout/common";
import useUsers from "../hooks/use-users";
import { UserRowActions } from "./user-row-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/base/components/ui/select";
export function UsersScreen() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const query = useUsers(search, status, page, size);
  return (
    <div className="page">
      <Heading title={t("users")} />
      <section className="panel table-panel">
        <div className="table-tools">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
          />
          <Select
            value={status || "ALL"}
            onValueChange={(value) => {
              setStatus(value === "ALL" ? "" : value);
              setPage(0);
            }}
          >
            <SelectTrigger aria-label={t("status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("all")}</SelectItem>
              {["ACTIVE", "INACTIVE", "DELETED"].map((value) => (
                <SelectItem key={value} value={value}>
                  {t(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {query.error ? (
          <ErrorState retry={query.refetch} />
        ) : !query.data ? (
          <Loading />
        ) : !query.data.items.length ? (
          <Empty message={t("noUsers")} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {["name", "status", "role", "actions"].map((key) => (
                    <th key={key}>{t(key)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Link href={"/users/" + user.id} className="row">
                        <Avatar
                          name={user.name || user.email}
                          url={user.avatarUrl}
                        />
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="muted small">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <Status value={user.status} />
                    </td>
                    <td>
                      <span className="small">
                        {t(user.admin ? "admin" : "member")}
                      </span>
                    </td>
                    <td>
                      <UserRowActions user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {query.data && (
          <Pagination data={query.data} onPage={setPage} onPageSize={setSize} />
        )}
      </section>
    </div>
  );
}
