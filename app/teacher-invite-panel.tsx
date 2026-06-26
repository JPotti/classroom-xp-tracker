"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MemberRole = "teacher" | "assistant" | "viewer";

type TeacherInvitePanelProps = {
  classId: string;
};

export default function TeacherInvitePanel({
  classId,
}: TeacherInvitePanelProps) {
  const [supabase] = useState(() => createClient());

  const [memberRole, setMemberRole] =
    useState<MemberRole>("teacher");

  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] =
    useState<string | null>(null);

  const [isError, setIsError] = useState(false);
  const [isCreating, setIsCreating] =
    useState(false);

  async function createInvitation() {
    setIsCreating(true);
    setMessage(null);
    setIsError(false);
    setInviteLink("");

    try {
      const { data, error } = await supabase.rpc(
        "create_class_invite",
        {
          requested_class_id: classId,
          requested_member_role: memberRole,
        },
      );

      if (error) {
        throw error;
      }

      const link = `${window.location.origin}/invite/${data}`;

      setInviteLink(link);
      setMessage(
        "Invitation created. This link expires in seven days.",
      );
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create the invitation.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyInvitation() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage("Invitation link copied.");
      setIsError(false);
    } catch {
      setMessage(
        "The link could not be copied automatically. Select and copy it manually.",
      );
      setIsError(true);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-cyan-500/30 bg-slate-900 p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          Invite another teacher
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Create a secure, single-use invitation link.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <label>
          <span className="mb-2 block text-sm font-semibold text-slate-300">
            Permission level
          </span>

          <select
            value={memberRole}
            onChange={(event) =>
              setMemberRole(
                event.target.value as MemberRole,
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
          >
            <option value="teacher">
              Teacher — full classroom editing
            </option>

            <option value="assistant">
              Assistant — award XP and edit records
            </option>

            <option value="viewer">
              Viewer — read only
            </option>
          </select>
        </label>

        <button
          type="button"
          onClick={createInvitation}
          disabled={isCreating}
          className="self-end rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {isCreating
            ? "Creating..."
            : "Create invitation"}
        </button>
      </div>

      {inviteLink && (
        <div className="mt-5 rounded-xl bg-slate-950 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-300">
            Invitation link
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={inviteLink}
              onFocus={(event) =>
                event.currentTarget.select()
              }
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300"
            />

            <button
              type="button"
              onClick={copyInvitation}
              className="rounded-lg bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600"
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            isError
              ? "border-red-500/40 bg-red-950/40 text-red-200"
              : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
          }`}
        >
          {message}
        </div>
      )}
    </section>
  );
}