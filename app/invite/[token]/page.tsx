"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type InviteDetails = {
  class_id: string;
  class_name: string;
  member_role: string;
  expires_at: string;
  is_expired: boolean;
  is_accepted: boolean;
};

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();

  const [supabase] = useState(() => createClient());

  const [invite, setInvite] =
    useState<InviteDetails | null>(null);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [isError, setIsError] = useState(false);

  const token = params.token;

  useEffect(() => {
    async function loadInvitation() {
      try {
        const [
          inviteResult,
          userResult,
        ] = await Promise.all([
          supabase.rpc("get_class_invite", {
            requested_token: token,
          }),

          supabase.auth.getUser(),
        ]);

        if (inviteResult.error) {
          throw inviteResult.error;
        }

        const inviteData =
          inviteResult.data?.[0] ?? null;

        if (!inviteData) {
          throw new Error(
            "This invitation could not be found.",
          );
        }

        setInvite(inviteData as InviteDetails);
        setIsSignedIn(Boolean(userResult.data.user));
      } catch (error) {
        setIsError(true);

        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load the invitation.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInvitation();
  }, [supabase, token]);

  async function acceptInvitation() {
    if (!invite) {
      return;
    }

    setIsAccepting(true);
    setMessage(null);
    setIsError(false);

    try {
      const { error } = await supabase.rpc(
        "accept_class_invite",
        {
          requested_token: token,
        },
      );

      if (error) {
        throw error;
      }

      setMessage(
        `You have joined ${invite.class_name}.`,
      );

      router.push("/");
      router.refresh();
    } catch (error) {
      setIsError(true);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not accept the invitation.",
      );
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading invitation...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
          Classroom invitation
        </p>

        {invite && (
          <>
            <h1 className="text-3xl font-bold">
              Join {invite.class_name}
            </h1>

            <p className="mt-3 text-slate-400">
              You have been invited as a{" "}
              <strong className="text-white">
                {invite.member_role}
              </strong>
              .
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Expires{" "}
              {new Date(
                invite.expires_at,
              ).toLocaleDateString()}
            </p>
          </>
        )}

        {invite?.is_expired && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-200">
            This invitation has expired. Ask the class
            owner to create a new one.
          </div>
        )}

        {invite?.is_accepted && (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-amber-200">
            This invitation has already been used.
          </div>
        )}

        {message && (
          <div
            className={`mt-6 rounded-xl border p-4 ${
              isError
                ? "border-red-500/40 bg-red-950/40 text-red-200"
                : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        {!isSignedIn &&
          invite &&
          !invite.is_expired &&
          !invite.is_accepted && (
            <div className="mt-7">
              <p className="mb-4 text-sm text-slate-400">
                Sign in or create an account before
                accepting this invitation.
              </p>

              <Link
                href={`/login?next=/invite/${token}`}
                className="block rounded-xl bg-emerald-500 px-5 py-3 text-center font-bold text-slate-950 hover:bg-emerald-400"
              >
                Continue to sign in
              </Link>
            </div>
          )}

        {isSignedIn &&
          invite &&
          !invite.is_expired &&
          !invite.is_accepted && (
            <button
              type="button"
              onClick={acceptInvitation}
              disabled={isAccepting}
              className="mt-7 w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {isAccepting
                ? "Joining class..."
                : "Accept invitation"}
            </button>
          )}
      </section>
    </main>
  );
}