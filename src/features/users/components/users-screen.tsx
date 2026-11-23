"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Button } from "@/base/components/ui/button";
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
          <select
            className="select"
            aria-label={t("status")}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
          >
            <option value="">{t("all")}</option>
            {["ACTIVE", "INACTIVE", "DELETED"].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={"/users/" + user.id}>
                          {t("view")}
                          <ChevronRight size={15} />
                        </Link>
                      </Button>
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
