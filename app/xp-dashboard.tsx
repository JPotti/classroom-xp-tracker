"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import TeacherInvitePanel from "./teacher-invite-panel";

type Role =
  | "Science Communicator"
  | "Astronaut"
  | "Next Einstein";

type ActionScope = Role | "All roles";

type ClassRecord = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

type StudentRow = {
  id: string;
  class_id: string;
  name: string;
  character_role: Role;
  xp: number;
  is_active: boolean;
  created_at: string;
};

type XPActionRow = {
  id: string;
  class_id: string;
  label: string;
  amount: number;
  scope: ActionScope;
  is_active: boolean;
  created_at: string;
};

type XPTransactionRow = {
  id: string;
  class_id: string;
  student_id: string | null;
  student_name: string;
  action_id: string | null;
  reason: string;
  amount: number;
  awarded_by: string;
  created_at: string;
  reversed_transaction_id: string | null;
};

type Level = {
  level: number;
  title: string;
  requiredXP: number;
};

const roles: Role[] = [
  "Science Communicator",
  "Astronaut",
  "Next Einstein",
];

const actionScopes: ActionScope[] = [
  "All roles",
  "Science Communicator",
  "Astronaut",
  "Next Einstein",
];

const levels: Level[] = [
  {
    level: 1,
    title: "Curious Rookie",
    requiredXP: 0,
  },
  {
    level: 2,
    title: "Lab Apprentice",
    requiredXP: 100,
  },
  {
    level: 3,
    title: "Scientific Explorer",
    requiredXP: 250,
  },
  {
    level: 4,
    title: "Research Specialist",
    requiredXP: 450,
  },
  {
    level: 5,
    title: "Master of Discovery",
    requiredXP: 700,
  },
  {
    level: 6,
    title: "Scientific Legend",
    requiredXP: 1000,
  },
];

const roleAvatars: Record<Role, string> = {
  "Science Communicator":
    "/avatars/science-communicator.png",
  Astronaut: "/avatars/astronaut.png",
  "Next Einstein": "/avatars/next-einstein.png",
};

export default function XPTrackerDashboard() {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const [availableClasses, setAvailableClasses] =
    useState<ClassRecord[]>([]);

  const [currentClass, setCurrentClass] =
    useState<ClassRecord | null>(null);

  const [students, setStudents] =
    useState<StudentRow[]>([]);

  const [xpActions, setXpActions] =
    useState<XPActionRow[]>([]);

  const [transactions, setTransactions] =
    useState<XPTransactionRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const [pageError, setPageError] =
    useState<string | null>(null);

  const [newClassName, setNewClassName] =
    useState("My Science Class");

  const [
    additionalClassName,
    setAdditionalClassName,
  ] = useState("");

  const [showClassManager, setShowClassManager] =
    useState(false);

  const [showStudentManager, setShowStudentManager] =
    useState(false);

  const [showActionManager, setShowActionManager] =
    useState(false);

  const [showTeacherManager, setShowTeacherManager] =
    useState(false);

  const [newStudentName, setNewStudentName] =
    useState("");

  const [newStudentRole, setNewStudentRole] =
    useState<Role>("Science Communicator");

  const [newActionLabel, setNewActionLabel] =
    useState("");

  const [newActionAmount, setNewActionAmount] =
    useState(5);

  const [newActionScope, setNewActionScope] =
    useState<ActionScope>("All roles");

  const loadClassData = useCallback(
    async (classId: string) => {
      const [
        studentsResult,
        actionsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("class_id", classId)
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("xp_actions")
          .select("*")
          .eq("class_id", classId)
          .eq("is_active", true)
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("xp_transactions")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", {
            ascending: false,
          })
          .limit(50),
      ]);

      const firstError =
        studentsResult.error ??
        actionsResult.error ??
        transactionsResult.error;

      if (firstError) {
        throw firstError;
      }

      setStudents(
        (studentsResult.data ?? []) as StudentRow[],
      );

      setXpActions(
        (actionsResult.data ?? []) as XPActionRow[],
      );

      setTransactions(
        (transactionsResult.data ??
          []) as XPTransactionRow[],
      );
    },
    [supabase],
  );

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        router.refresh();
        return;
      }

      const {
        data: classData,
        error: classesError,
      } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

      if (classesError) {
        throw classesError;
      }

      const classes =
        (classData ?? []) as ClassRecord[];

      setAvailableClasses(classes);

      if (classes.length === 0) {
        setCurrentClass(null);
        setStudents([]);
        setXpActions([]);
        setTransactions([]);
        return;
      }

      const savedClassId =
        localStorage.getItem(
          "xp-tracker-selected-class",
        );

      const selectedClass =
        classes.find(
          (classRecord) =>
            classRecord.id === savedClassId,
        ) ?? classes[0];

      setCurrentClass(selectedClass);

      localStorage.setItem(
        "xp-tracker-selected-class",
        selectedClass.id,
      );

      await loadClassData(selectedClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not load your classrooms.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadClassData, router, supabase]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!currentClass) {
      return;
    }

    const classId = currentClass.id;

    const channel = supabase
      .channel(`class-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `class_id=eq.${classId}`,
        },
        () => {
          void loadClassData(classId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "xp_actions",
          filter: `class_id=eq.${classId}`,
        },
        () => {
          void loadClassData(classId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "xp_transactions",
          filter: `class_id=eq.${classId}`,
        },
        () => {
          void loadClassData(classId);
        },
      )
      .subscribe((status, error) => {
        if (error) {
          console.error(
            "Realtime subscription error:",
            error,
          );
        }

        if (status === "CHANNEL_ERROR") {
          setPageError(
            "Live updates could not connect. Refreshing the page will still load the latest data.",
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentClass, loadClassData, supabase]);

  async function createFirstClass(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanedName = newClassName.trim();

    if (!cleanedName || isWorking) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { data, error } = await supabase.rpc(
        "create_class_with_defaults",
        {
          requested_name: cleanedName,
        },
      );

      if (error) {
        throw error;
      }

      const classId = data as string;

      const {
        data: createdClass,
        error: classError,
      } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (classError) {
        throw classError;
      }

      const newClass =
        createdClass as ClassRecord;

      setAvailableClasses([newClass]);
      setCurrentClass(newClass);

      localStorage.setItem(
        "xp-tracker-selected-class",
        newClass.id,
      );

      await loadClassData(newClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not create the class.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function createAdditionalClass(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanedName =
      additionalClassName.trim();

    if (!cleanedName || isWorking) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { data, error } = await supabase.rpc(
        "create_class_with_defaults",
        {
          requested_name: cleanedName,
        },
      );

      if (error) {
        throw error;
      }

      const classId = data as string;

      const {
        data: createdClass,
        error: classError,
      } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (classError) {
        throw classError;
      }

      const newClass =
        createdClass as ClassRecord;

      setAvailableClasses(
        (currentClasses) => [
          ...currentClasses,
          newClass,
        ],
      );

      setCurrentClass(newClass);

      localStorage.setItem(
        "xp-tracker-selected-class",
        newClass.id,
      );

      setAdditionalClassName("");
      setShowClassManager(false);

      setStudents([]);
      setXpActions([]);
      setTransactions([]);

      await loadClassData(newClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not create the classroom.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function switchClass(classId: string) {
    if (
      isWorking ||
      currentClass?.id === classId
    ) {
      return;
    }

    const selectedClass =
      availableClasses.find(
        (classRecord) =>
          classRecord.id === classId,
      );

    if (!selectedClass) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      setCurrentClass(selectedClass);

      localStorage.setItem(
        "xp-tracker-selected-class",
        selectedClass.id,
      );

      setStudents([]);
      setXpActions([]);
      setTransactions([]);

      setShowStudentManager(false);
      setShowActionManager(false);
      setShowTeacherManager(false);

      await loadClassData(selectedClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not switch classrooms.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  async function awardXP(
    studentId: string,
    actionId: string,
  ) {
    if (!currentClass || isWorking) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase.rpc(
        "award_xp",
        {
          requested_student_id: studentId,
          requested_action_id: actionId,
        },
      );

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not award XP.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function undoLastAction() {
    if (!currentClass || isWorking) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase.rpc(
        "undo_last_xp",
        {
          requested_class_id: currentClass.id,
        },
      );

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not undo the XP action.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function addStudent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!currentClass || isWorking) {
      return;
    }

    const cleanedName = newStudentName.trim();

    if (!cleanedName) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("students")
        .insert({
          class_id: currentClass.id,
          name: cleanedName,
          character_role: newStudentRole,
          xp: 0,
        });

      if (error) {
        throw error;
      }

      setNewStudentName("");

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not add the student.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function editStudent(student: StudentRow) {
    if (!currentClass || isWorking) {
      return;
    }

    const updatedName = window.prompt(
      "Enter the student's name:",
      student.name,
    );

    if (updatedName === null) {
      return;
    }

    const cleanedName = updatedName.trim();

    if (!cleanedName) {
      window.alert("The student must have a name.");
      return;
    }

    const roleAnswer = window.prompt(
      [
        "Choose a role:",
        "1 - Science Communicator",
        "2 - Astronaut",
        "3 - Next Einstein",
      ].join("\n"),
      String(
        roles.indexOf(student.character_role) + 1,
      ),
    );

    if (roleAnswer === null) {
      return;
    }

    const updatedRole =
      roles[Number(roleAnswer) - 1];

    if (!updatedRole) {
      window.alert("Please enter 1, 2, or 3.");
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: cleanedName,
          character_role: updatedRole,
        })
        .eq("id", student.id);

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not update the student.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteStudent(student: StudentRow) {
    if (!currentClass || isWorking) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${student.name} from the active class?\n\nTheir XP history will remain in the activity records.`,
    );

    if (!confirmed) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          is_active: false,
        })
        .eq("id", student.id);

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not remove the student.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function addXPAction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!currentClass || isWorking) {
      return;
    }

    const cleanedLabel = newActionLabel.trim();

    if (!cleanedLabel) {
      return;
    }

    if (
      !Number.isFinite(newActionAmount) ||
      newActionAmount === 0
    ) {
      window.alert(
        "Enter a valid XP amount other than zero.",
      );
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("xp_actions")
        .insert({
          class_id: currentClass.id,
          label: cleanedLabel,
          amount: newActionAmount,
          scope: newActionScope,
        });

      if (error) {
        throw error;
      }

      setNewActionLabel("");
      setNewActionAmount(5);
      setNewActionScope("All roles");

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not create the XP action.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function editXPAction(
    action: XPActionRow,
  ) {
    if (!currentClass || isWorking) {
      return;
    }

    const updatedLabel = window.prompt(
      "Enter the action name:",
      action.label,
    );

    if (updatedLabel === null) {
      return;
    }

    const cleanedLabel = updatedLabel.trim();

    if (!cleanedLabel) {
      window.alert("The action must have a name.");
      return;
    }

    const amountAnswer = window.prompt(
      "Enter the XP amount. Use a negative number for a penalty:",
      String(action.amount),
    );

    if (amountAnswer === null) {
      return;
    }

    const updatedAmount = Number(amountAnswer);

    if (
      !Number.isFinite(updatedAmount) ||
      updatedAmount === 0
    ) {
      window.alert(
        "Enter a valid number other than zero.",
      );
      return;
    }

    const scopeAnswer = window.prompt(
      [
        "Choose who can receive this action:",
        "1 - All roles",
        "2 - Science Communicator",
        "3 - Astronaut",
        "4 - Next Einstein",
      ].join("\n"),
      String(
        actionScopes.indexOf(action.scope) + 1,
      ),
    );

    if (scopeAnswer === null) {
      return;
    }

    const updatedScope =
      actionScopes[Number(scopeAnswer) - 1];

    if (!updatedScope) {
      window.alert("Please enter 1, 2, 3, or 4.");
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("xp_actions")
        .update({
          label: cleanedLabel,
          amount: updatedAmount,
          scope: updatedScope,
        })
        .eq("id", action.id);

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not update the XP action.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteXPAction(
    action: XPActionRow,
  ) {
    if (!currentClass || isWorking) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${action.label}" from the available XP actions?`,
    );

    if (!confirmed) {
      return;
    }

    setIsWorking(true);
    setPageError(null);

    try {
      const { error } = await supabase
        .from("xp_actions")
        .update({
          is_active: false,
        })
        .eq("id", action.id);

      if (error) {
        throw error;
      }

      await loadClassData(currentClass.id);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Could not remove the XP action.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  function getRoleLabelStyle(role: Role) {
    if (role === "Science Communicator") {
      return "text-emerald-400";
    }

    if (role === "Astronaut") {
      return "text-blue-400";
    }

    return "text-red-400";
  }

  function getRoleBorderStyle(role: Role) {
    if (role === "Science Communicator") {
      return "border-emerald-400";
    }

    if (role === "Astronaut") {
      return "border-blue-400";
    }

    return "border-red-400";
  }

  function getRoleCardStyle(role: Role) {
    if (role === "Science Communicator") {
      return "border-emerald-500/40 bg-emerald-950/20";
    }

    if (role === "Astronaut") {
      return "border-blue-500/40 bg-blue-950/20";
    }

    return "border-red-500/40 bg-red-950/20";
  }

  function getRoleProgressStyle(role: Role) {
    if (role === "Science Communicator") {
      return "bg-emerald-400";
    }

    if (role === "Astronaut") {
      return "bg-blue-400";
    }

    return "bg-red-400";
  }

  function getScopeStyle(scope: ActionScope) {
    if (scope === "Science Communicator") {
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-300";
    }

    if (scope === "Astronaut") {
      return "border-blue-500/30 bg-blue-950/30 text-blue-300";
    }

    if (scope === "Next Einstein") {
      return "border-red-500/30 bg-red-950/30 text-red-300";
    }

    return "border-slate-600 bg-slate-700 text-slate-300";
  }

  function getStudentLevel(xp: number) {
    const currentLevel =
      [...levels]
        .reverse()
        .find(
          (level) => xp >= level.requiredXP,
        ) ?? levels[0];

    const currentIndex = levels.findIndex(
      (level) =>
        level.level === currentLevel.level,
    );

    const nextLevel =
      levels[currentIndex + 1] ?? null;

    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        progress: 100,
      };
    }

    const progress =
      ((xp - currentLevel.requiredXP) /
        (nextLevel.requiredXP -
          currentLevel.requiredXP)) *
      100;

    return {
      currentLevel,
      nextLevel,
      progress: Math.min(
        100,
        Math.max(0, progress),
      ),
    };
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading your shared classrooms...
        </p>
      </main>
    );
  }

  if (!currentClass) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
            Regent Camps
          </p>

          <h1 className="text-3xl font-bold">
            Create your first class
          </h1>

          <p className="mt-2 text-slate-400">
            Each classroom will have its own students, XP
            actions, progress, teachers, and activity
            history.
          </p>

          {pageError && (
            <div className="mt-5 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-200">
              {pageError}
            </div>
          )}

          <form
            onSubmit={createFirstClass}
            className="mt-7 space-y-4"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">
                Class name
              </span>

              <input
                value={newClassName}
                onChange={(event) =>
                  setNewClassName(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
              />
            </label>

            <button
              type="submit"
              disabled={isWorking}
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isWorking
                ? "Creating class..."
                : "Create shared class"}
            </button>
          </form>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Regent Camps
            </p>

            <h1 className="truncate text-4xl font-bold">
              {currentClass.name}
            </h1>

            <p className="mt-2 text-slate-400">
              Shared classroom XP tracker
            </p>

            {availableClasses.length > 1 && (
              <label className="mt-4 block max-w-sm">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current classroom
                </span>

                <select
                  value={currentClass.id}
                  onChange={(event) =>
                    void switchClass(
                      event.target.value,
                    )
                  }
                  disabled={isWorking}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-white outline-none transition focus:border-emerald-400 disabled:opacity-50"
                >
                  {availableClasses.map(
                    (classRecord) => (
                      <option
                        key={classRecord.id}
                        value={classRecord.id}
                      >
                        {classRecord.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setShowClassManager(
                  (value) => !value,
                )
              }
              className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              {showClassManager
                ? "Close classrooms"
                : "Manage classrooms"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowStudentManager(
                  (value) => !value,
                )
              }
              className="rounded-xl bg-blue-500 px-4 py-3 font-semibold transition hover:bg-blue-400"
            >
              {showStudentManager
                ? "Close students"
                : "Manage students"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowActionManager(
                  (value) => !value,
                )
              }
              className="rounded-xl bg-purple-500 px-4 py-3 font-semibold transition hover:bg-purple-400"
            >
              {showActionManager
                ? "Close XP actions"
                : "Manage XP actions"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowTeacherManager(
                  (value) => !value,
                )
              }
              className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              {showTeacherManager
                ? "Close teachers"
                : "Manage teachers"}
            </button>

            <button
              type="button"
              onClick={undoLastAction}
              disabled={
                isWorking ||
                transactions.length === 0
              }
              className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Undo
            </button>

            <button
              type="button"
              onClick={signOut}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        {pageError && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-red-200">
            <p>{pageError}</p>

            <button
              type="button"
              onClick={() => setPageError(null)}
              aria-label="Dismiss error"
              className="text-xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        )}

        {showClassManager && (
          <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-slate-900 p-5">
            <div>
              <h2 className="text-2xl font-bold">
                Manage classrooms
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Create another classroom or switch between
                the classrooms available to you.
              </p>
            </div>

            <form
              onSubmit={createAdditionalClass}
              className="my-6 flex flex-col gap-4 sm:flex-row"
            >
              <label className="flex-1">
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  New classroom name
                </span>

                <input
                  value={additionalClassName}
                  onChange={(event) =>
                    setAdditionalClassName(
                      event.target.value,
                    )
                  }
                  placeholder="For example: Space Explorers"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-emerald-400"
                />
              </label>

              <button
                type="submit"
                disabled={isWorking}
                className="self-end rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isWorking
                  ? "Creating..."
                  : "Create classroom"}
              </button>
            </form>

            <div className="space-y-3">
              {availableClasses.map(
                (classRecord) => {
                  const isSelected =
                    classRecord.id ===
                    currentClass.id;

                  return (
                    <button
                      key={classRecord.id}
                      type="button"
                      disabled={
                        isSelected || isWorking
                      }
                      onClick={() =>
                        void switchClass(
                          classRecord.id,
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-950/30"
                          : "border-slate-700 bg-slate-800 hover:border-slate-500"
                      } disabled:cursor-default`}
                    >
                      <div>
                        <p className="font-bold">
                          {classRecord.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Created{" "}
                          {new Date(
                            classRecord.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isSelected
                          ? "Current"
                          : "Open"}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>
        )}

        {showTeacherManager && (
          <TeacherInvitePanel
            classId={currentClass.id}
          />
        )}

        {showStudentManager && (
          <section className="mb-8 rounded-2xl border border-blue-500/30 bg-slate-900 p-5">
            <div>
              <h2 className="text-2xl font-bold">
                Manage students
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Add students and assign their character
                paths.
              </p>
            </div>

            <form
              onSubmit={addStudent}
              className="my-6 grid gap-4 md:grid-cols-[2fr_1fr_auto]"
            >
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Student name
                </span>

                <input
                  value={newStudentName}
                  onChange={(event) =>
                    setNewStudentName(
                      event.target.value,
                    )
                  }
                  placeholder="Student name"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-400"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Character path
                </span>

                <select
                  value={newStudentRole}
                  onChange={(event) =>
                    setNewStudentRole(
                      event.target.value as Role,
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-400"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isWorking}
                className="self-end rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                Add student
              </button>
            </form>

            {students.length === 0 ? (
              <p className="text-slate-400">
                No students have been added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 ${getRoleBorderStyle(
                          student.character_role,
                        )}`}
                      >
                        <Image
                          src={
                            roleAvatars[
                              student.character_role
                            ]
                          }
                          alt={`${student.character_role} avatar`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <p className="font-bold">
                          {student.name}
                        </p>

                        <p
                          className={`text-sm ${getRoleLabelStyle(
                            student.character_role,
                          )}`}
                        >
                          {student.character_role} ·{" "}
                          {student.xp} XP
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() =>
                          editStudent(student)
                        }
                        className="rounded-lg bg-slate-700 px-4 py-2 font-semibold transition hover:bg-slate-600 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() =>
                          deleteStudent(student)
                        }
                        className="rounded-lg bg-red-950 px-4 py-2 font-semibold text-red-300 transition hover:bg-red-900 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {showActionManager && (
          <section className="mb-8 rounded-2xl border border-purple-500/30 bg-slate-900 p-5">
            <div>
              <h2 className="text-2xl font-bold">
                Manage XP actions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Create general actions or role-specific
                bonuses.
              </p>
            </div>

            <form
              onSubmit={addXPAction}
              className="my-6 grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]"
            >
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Action name
                </span>

                <input
                  value={newActionLabel}
                  onChange={(event) =>
                    setNewActionLabel(
                      event.target.value,
                    )
                  }
                  placeholder="Action name"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-purple-400"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  XP amount
                </span>

                <input
                  type="number"
                  value={newActionAmount}
                  onChange={(event) =>
                    setNewActionAmount(
                      Number(event.target.value),
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-purple-400"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Available to
                </span>

                <select
                  value={newActionScope}
                  onChange={(event) =>
                    setNewActionScope(
                      event.target
                        .value as ActionScope,
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-purple-400"
                >
                  {actionScopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isWorking}
                className="self-end rounded-xl bg-purple-500 px-5 py-3 font-bold transition hover:bg-purple-400 disabled:opacity-50"
              >
                Add action
              </button>
            </form>

            {xpActions.length === 0 ? (
              <p className="text-slate-400">
                No XP actions have been added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {xpActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex flex-col gap-4 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">
                        {action.label}
                      </p>

                      <p
                        className={
                          action.amount > 0
                            ? "text-sm text-emerald-400"
                            : "text-sm text-red-400"
                        }
                      >
                        {action.amount > 0
                          ? `+${action.amount}`
                          : action.amount}{" "}
                        XP
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getScopeStyle(
                          action.scope,
                        )}`}
                      >
                        {action.scope === "All roles"
                          ? "Available to everyone"
                          : `${action.scope} bonus`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() =>
                          editXPAction(action)
                        }
                        className="rounded-lg bg-slate-700 px-4 py-2 font-semibold transition hover:bg-slate-600 disabled:opacity-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() =>
                          deleteXPAction(action)
                        }
                        className="rounded-lg bg-red-950 px-4 py-2 font-semibold text-red-300 transition hover:bg-red-900 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
          <section>
            {students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <h2 className="text-xl font-bold">
                  This classroom is empty
                </h2>

                <p className="mt-2 text-slate-400">
                  Open Manage students to add learners to{" "}
                  {currentClass.name}.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {students.map((student) => {
                  const role =
                    student.character_role;

                  const levelData =
                    getStudentLevel(student.xp);

                  const generalActions =
                    xpActions.filter(
                      (action) =>
                        action.scope === "All roles",
                    );

                  const roleActions =
                    xpActions.filter(
                      (action) =>
                        action.scope === role,
                    );

                  return (
                    <article
                      key={student.id}
                      className={`rounded-2xl border p-5 shadow-lg ${getRoleCardStyle(
                        role,
                      )}`}
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <div
                          className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 ${getRoleBorderStyle(
                            role,
                          )}`}
                        >
                          <Image
                            src={roleAvatars[role]}
                            alt={`${role} avatar`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${getRoleLabelStyle(
                              role,
                            )}`}
                          >
                            {role}
                          </p>

                          <div className="mt-1 flex items-end justify-between gap-2">
                            <h2 className="truncate text-2xl font-bold">
                              {student.name}
                            </h2>

                            <p className="shrink-0 font-bold text-amber-400">
                              {student.xp} XP
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-5 rounded-xl bg-slate-950/60 p-4">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold">
                              Level{" "}
                              {
                                levelData
                                  .currentLevel.level
                              }
                            </p>

                            <p className="text-sm text-slate-400">
                              {
                                levelData
                                  .currentLevel.title
                              }
                            </p>
                          </div>

                          {levelData.nextLevel ? (
                            <p className="text-right text-xs text-slate-400">
                              {student.xp} /{" "}
                              {
                                levelData
                                  .nextLevel.requiredXP
                              }{" "}
                              XP
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-amber-400">
                              Maximum level
                            </p>
                          )}
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getRoleProgressStyle(
                              role,
                            )}`}
                            style={{
                              width: `${levelData.progress}%`,
                            }}
                          />
                        </div>

                        {levelData.nextLevel && (
                          <p className="mt-2 text-xs text-slate-500">
                            {levelData.nextLevel
                              .requiredXP -
                              student.xp}{" "}
                            XP until Level{" "}
                            {
                              levelData.nextLevel.level
                            }
                          </p>
                        )}
                      </div>

                      {generalActions.length === 0 &&
                      roleActions.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No XP actions are available.
                        </p>
                      ) : (
                        <div className="space-y-5">
                          {generalActions.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                General XP
                              </p>

                              <div className="grid grid-cols-2 gap-3">
                                {generalActions.map(
                                  (action) => (
                                    <button
                                      key={action.id}
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() =>
                                        awardXP(
                                          student.id,
                                          action.id,
                                        )
                                      }
                                      className="rounded-xl bg-slate-900/80 p-3 text-left transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <span className="block text-sm font-semibold">
                                        {action.label}
                                      </span>

                                      <span
                                        className={
                                          action.amount >
                                          0
                                            ? "mt-1 block text-sm text-emerald-400"
                                            : "mt-1 block text-sm text-red-400"
                                        }
                                      >
                                        {action.amount > 0
                                          ? `+${action.amount}`
                                          : action.amount}{" "}
                                        XP
                                      </span>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {roleActions.length > 0 && (
                            <div>
                              <p
                                className={`mb-2 text-xs font-bold uppercase tracking-wider ${getRoleLabelStyle(
                                  role,
                                )}`}
                              >
                                {role} bonuses
                              </p>

                              <div className="grid grid-cols-2 gap-3">
                                {roleActions.map(
                                  (action) => (
                                    <button
                                      key={action.id}
                                      type="button"
                                      disabled={isWorking}
                                      onClick={() =>
                                        awardXP(
                                          student.id,
                                          action.id,
                                        )
                                      }
                                      className={`rounded-xl border p-3 text-left transition hover:brightness-125 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${getScopeStyle(
                                        action.scope,
                                      )}`}
                                    >
                                      <span className="block text-xs font-bold uppercase tracking-wide">
                                        Role bonus
                                      </span>

                                      <span className="mt-1 block text-sm font-semibold text-white">
                                        {action.label}
                                      </span>

                                      <span
                                        className={
                                          action.amount >
                                          0
                                            ? "mt-1 block text-sm text-emerald-300"
                                            : "mt-1 block text-sm text-red-300"
                                        }
                                      >
                                        {action.amount > 0
                                          ? `+${action.amount}`
                                          : action.amount}{" "}
                                        XP
                                      </span>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Recent activity
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {currentClass.name}
                </p>
              </div>

              <span className="text-sm text-slate-400">
                {transactions.length}
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-sm text-slate-400">
                No XP has been awarded in this classroom
                yet.
              </p>
            ) : (
              <div className="space-y-3">
                {transactions
                  .slice(0, 15)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-xl bg-slate-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {
                              transaction.student_name
                            }
                          </p>

                          <p className="text-sm text-slate-400">
                            {transaction.reason}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>

                        <span
                          className={
                            transaction.amount > 0
                              ? "shrink-0 font-bold text-emerald-400"
                              : "shrink-0 font-bold text-red-400"
                          }
                        >
                          {transaction.amount > 0
                            ? `+${transaction.amount}`
                            : transaction.amount}{" "}
                          XP
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}