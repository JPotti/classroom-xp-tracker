"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

type Role =
  | "Science Communicator"
  | "Astronaut"
  | "Next Einstein";

type Student = {
  id: string;
  name: string;
  role: Role;
  xp: number;
};

type XPAction = {
  id: string;
  label: string;
  amount: number;
};

type XPTransaction = {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  amount: number;
  createdAt: string;
};

type Level = {
  level: number;
  title: string;
  requiredXP: number;
};

const initialStudents: Student[] = [
  {
    id: "student-1",
    name: "Lucía",
    role: "Science Communicator",
    xp: 40,
  },
  {
    id: "student-2",
    name: "Daniel",
    role: "Astronaut",
    xp: 65,
  },
  {
    id: "student-3",
    name: "Sofía",
    role: "Next Einstein",
    xp: 25,
  },
];

const initialXPActions: XPAction[] = [
  {
    id: "action-1",
    label: "Good question",
    amount: 10,
  },
  {
    id: "action-2",
    label: "Participation",
    amount: 5,
  },
  {
    id: "action-3",
    label: "Teamwork",
    amount: 10,
  },
  {
    id: "action-4",
    label: "Challenge completed",
    amount: 20,
  },
];

const roles: Role[] = [
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

export default function Home() {
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [xpActions, setXpActions] =
    useState<XPAction[]>(initialXPActions);

  const [transactions, setTransactions] = useState<
    XPTransaction[]
  >([]);

  const [isLoaded, setIsLoaded] = useState(false);

  const [showStudentManager, setShowStudentManager] =
    useState(false);

  const [showActionManager, setShowActionManager] =
    useState(false);

  const [newStudentName, setNewStudentName] = useState("");

  const [newStudentRole, setNewStudentRole] =
    useState<Role>("Science Communicator");

  const [newActionLabel, setNewActionLabel] = useState("");

  const [newActionAmount, setNewActionAmount] =
    useState<number>(5);

  useEffect(() => {
    try {
      const savedStudents = localStorage.getItem(
        "xp-tracker-students",
      );

      const savedTransactions = localStorage.getItem(
        "xp-tracker-transactions",
      );

      const savedActions = localStorage.getItem(
        "xp-tracker-actions",
      );

      if (savedStudents) {
        const parsedStudents = JSON.parse(savedStudents);

        const normalisedStudents: Student[] =
          parsedStudents.map(
            (student: {
              id: string | number;
              name: string;
              role: Role;
              xp: number;
            }) => ({
              ...student,
              id: String(student.id),
            }),
          );

        setStudents(normalisedStudents);
      }

      if (savedTransactions) {
        const parsedTransactions = JSON.parse(
          savedTransactions,
        );

        const normalisedTransactions: XPTransaction[] =
          parsedTransactions.map(
            (transaction: {
              id: string;
              studentId: string | number;
              studentName: string;
              reason: string;
              amount: number;
              createdAt: string;
            }) => ({
              ...transaction,
              studentId: String(transaction.studentId),
            }),
          );

        setTransactions(normalisedTransactions);
      }

      if (savedActions) {
        setXpActions(JSON.parse(savedActions));
      }
    } catch (error) {
      console.error(
        "Could not load saved XP tracker data:",
        error,
      );
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem(
      "xp-tracker-students",
      JSON.stringify(students),
    );
  }, [students, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem(
      "xp-tracker-transactions",
      JSON.stringify(transactions),
    );
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem(
      "xp-tracker-actions",
      JSON.stringify(xpActions),
    );
  }, [xpActions, isLoaded]);

  function awardXP(
    studentId: string,
    amount: number,
    reason: string,
  ) {
    const student = students.find(
      (currentStudent) =>
        currentStudent.id === studentId,
    );

    if (!student) {
      return;
    }

    const actualAmount =
      amount < 0
        ? Math.max(amount, -student.xp)
        : amount;

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.id === studentId
          ? {
              ...currentStudent,
              xp: currentStudent.xp + actualAmount,
            }
          : currentStudent,
      ),
    );

    const transaction: XPTransaction = {
      id: crypto.randomUUID(),
      studentId,
      studentName: student.name,
      reason,
      amount: actualAmount,
      createdAt: new Date().toISOString(),
    };

    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
  }

  function undoLastAction() {
    const lastTransaction = transactions[0];

    if (!lastTransaction) {
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === lastTransaction.studentId
          ? {
              ...student,
              xp: Math.max(
                0,
                student.xp - lastTransaction.amount,
              ),
            }
          : student,
      ),
    );

    setTransactions((currentTransactions) =>
      currentTransactions.slice(1),
    );
  }

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedName = newStudentName.trim();

    if (!cleanedName) {
      return;
    }

    const studentAlreadyExists = students.some(
      (student) =>
        student.name.toLowerCase() ===
        cleanedName.toLowerCase(),
    );

    if (studentAlreadyExists) {
      window.alert(
        "A student with that name already exists.",
      );
      return;
    }

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: cleanedName,
      role: newStudentRole,
      xp: 0,
    };

    setStudents((currentStudents) => [
      ...currentStudents,
      newStudent,
    ]);

    setNewStudentName("");
  }

  function editStudent(studentId: string) {
    const student = students.find(
      (currentStudent) =>
        currentStudent.id === studentId,
    );

    if (!student) {
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

    const duplicateStudent = students.some(
      (currentStudent) =>
        currentStudent.id !== studentId &&
        currentStudent.name.toLowerCase() ===
          cleanedName.toLowerCase(),
    );

    if (duplicateStudent) {
      window.alert(
        "A student with that name already exists.",
      );
      return;
    }

    const roleAnswer = window.prompt(
      [
        "Choose a role by entering its number:",
        "1 - Science Communicator",
        "2 - Astronaut",
        "3 - Next Einstein",
      ].join("\n"),
      String(roles.indexOf(student.role) + 1),
    );

    if (roleAnswer === null) {
      return;
    }

    const roleIndex = Number(roleAnswer) - 1;
    const updatedRole = roles[roleIndex];

    if (!updatedRole) {
      window.alert("Please enter 1, 2, or 3.");
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.id === studentId
          ? {
              ...currentStudent,
              name: cleanedName,
              role: updatedRole,
            }
          : currentStudent,
      ),
    );

    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.studentId === studentId
          ? {
              ...transaction,
              studentName: cleanedName,
            }
          : transaction,
      ),
    );
  }

  function deleteStudent(studentId: string) {
    const student = students.find(
      (currentStudent) =>
        currentStudent.id === studentId,
    );

    if (!student) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${student.name} from the class?\n\nTheir previous XP history will remain visible.`,
    );

    if (!confirmed) {
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.filter(
        (currentStudent) =>
          currentStudent.id !== studentId,
      ),
    );
  }

  function addXPAction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanedLabel = newActionLabel.trim();

    if (!cleanedLabel) {
      return;
    }

    if (newActionAmount === 0) {
      window.alert("The XP amount cannot be zero.");
      return;
    }

    const actionAlreadyExists = xpActions.some(
      (action) =>
        action.label.toLowerCase() ===
        cleanedLabel.toLowerCase(),
    );

    if (actionAlreadyExists) {
      window.alert(
        "An XP action with that name already exists.",
      );
      return;
    }

    const newAction: XPAction = {
      id: crypto.randomUUID(),
      label: cleanedLabel,
      amount: newActionAmount,
    };

    setXpActions((currentActions) => [
      ...currentActions,
      newAction,
    ]);

    setNewActionLabel("");
    setNewActionAmount(5);
  }

  function editXPAction(actionId: string) {
    const action = xpActions.find(
      (currentAction) =>
        currentAction.id === actionId,
    );

    if (!action) {
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

    const duplicateAction = xpActions.some(
      (currentAction) =>
        currentAction.id !== actionId &&
        currentAction.label.toLowerCase() ===
          cleanedLabel.toLowerCase(),
    );

    if (duplicateAction) {
      window.alert(
        "An XP action with that name already exists.",
      );
      return;
    }

    const updatedAmountText = window.prompt(
      "Enter the XP amount. Use a negative number for a penalty:",
      String(action.amount),
    );

    if (updatedAmountText === null) {
      return;
    }

    const updatedAmount = Number(updatedAmountText);

    if (
      !Number.isFinite(updatedAmount) ||
      updatedAmount === 0
    ) {
      window.alert(
        "Please enter a valid number other than zero.",
      );
      return;
    }

    setXpActions((currentActions) =>
      currentActions.map((currentAction) =>
        currentAction.id === actionId
          ? {
              ...currentAction,
              label: cleanedLabel,
              amount: updatedAmount,
            }
          : currentAction,
      ),
    );
  }

  function deleteXPAction(actionId: string) {
    const action = xpActions.find(
      (currentAction) =>
        currentAction.id === actionId,
    );

    if (!action) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the XP action "${action.label}"?`,
    );

    if (!confirmed) {
      return;
    }

    setXpActions((currentActions) =>
      currentActions.filter(
        (currentAction) =>
          currentAction.id !== actionId,
      ),
    );
  }

  function resetApp() {
    const confirmed = window.confirm(
      "Reset all students, XP actions, scores, and activity history?",
    );

    if (!confirmed) {
      return;
    }

    setStudents(initialStudents);
    setXpActions(initialXPActions);
    setTransactions([]);
  }

  function getRoleStyle(role: Role) {
    if (role === "Science Communicator") {
      return "border-emerald-500/40 bg-emerald-950/20";
    }

    if (role === "Astronaut") {
      return "border-blue-500/40 bg-blue-950/20";
    }

    return "border-red-500/40 bg-red-950/20";
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

  function getRoleProgressStyle(role: Role) {
    if (role === "Science Communicator") {
      return "bg-emerald-400";
    }

    if (role === "Astronaut") {
      return "bg-blue-400";
    }

    return "bg-red-400";
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

    const nextLevel = levels[currentIndex + 1] ?? null;

    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        progress: 100,
      };
    }

    const xpIntoLevel =
      xp - currentLevel.requiredXP;

    const xpNeededForLevel =
      nextLevel.requiredXP -
      currentLevel.requiredXP;

    const progress = Math.min(
      100,
      Math.max(
        0,
        (xpIntoLevel / xpNeededForLevel) * 100,
      ),
    );

    return {
      currentLevel,
      nextLevel,
      progress,
    };
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading XP tracker...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Regent Camps
            </p>

            <h1 className="text-4xl font-bold">
              Classroom XP Tracker
            </h1>

            <p className="mt-2 text-slate-400">
              Award XP without interrupting the lesson.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setShowStudentManager(
                  (currentValue) => !currentValue,
                )
              }
              className="rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400"
            >
              {showStudentManager
                ? "Close students"
                : "Manage students"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowActionManager(
                  (currentValue) => !currentValue,
                )
              }
              className="rounded-xl bg-purple-500 px-4 py-3 font-semibold text-white transition hover:bg-purple-400"
            >
              {showActionManager
                ? "Close XP actions"
                : "Manage XP actions"}
            </button>

            <button
              type="button"
              onClick={undoLastAction}
              disabled={transactions.length === 0}
              className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Undo
            </button>

            <button
              type="button"
              onClick={resetApp}
              className="rounded-xl bg-slate-800 px-4 py-3 font-semibold transition hover:bg-slate-700"
            >
              Reset
            </button>
          </div>
        </header>

        {showStudentManager && (
          <section className="mb-8 rounded-2xl border border-blue-500/30 bg-slate-900 p-5">
            <div className="mb-6">
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
              className="mb-8 grid gap-4 md:grid-cols-[2fr_1fr_auto]"
            >
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Student name
                </span>

                <input
                  type="text"
                  value={newStudentName}
                  onChange={(event) =>
                    setNewStudentName(
                      event.target.value,
                    )
                  }
                  placeholder="Enter a name"
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
                className="self-end rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Add student
              </button>
            </form>

            <div className="space-y-3">
              {students.length === 0 ? (
                <p className="text-slate-400">
                  No students have been added yet.
                </p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 ${getRoleBorderStyle(
                          student.role,
                        )}`}
                      >
                        <Image
                          src={
                            roleAvatars[student.role]
                          }
                          alt={`${student.role} avatar`}
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
                            student.role,
                          )}`}
                        >
                          {student.role} ·{" "}
                          {student.xp} XP
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editStudent(student.id)
                        }
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteStudent(student.id)
                        }
                        className="rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {showActionManager && (
          <section className="mb-8 rounded-2xl border border-purple-500/30 bg-slate-900 p-5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Manage XP actions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Positive numbers award XP. Negative
                numbers remove XP.
              </p>
            </div>

            <form
              onSubmit={addXPAction}
              className="mb-8 grid gap-4 md:grid-cols-[2fr_1fr_auto]"
            >
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Action name
                </span>

                <input
                  type="text"
                  value={newActionLabel}
                  onChange={(event) =>
                    setNewActionLabel(
                      event.target.value,
                    )
                  }
                  placeholder="For example: Arrived on time"
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

              <button
                type="submit"
                className="self-end rounded-xl bg-purple-500 px-5 py-3 font-bold text-white transition hover:bg-purple-400"
              >
                Add action
              </button>
            </form>

            <div className="space-y-3">
              {xpActions.length === 0 ? (
                <p className="text-slate-400">
                  No XP actions have been created yet.
                </p>
              ) : (
                xpActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editXPAction(action.id)
                        }
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteXPAction(action.id)
                        }
                        className="rounded-lg bg-red-950 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
          <section>
            {students.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <h2 className="text-xl font-bold">
                  Your class is empty
                </h2>

                <p className="mt-2 text-slate-400">
                  Open Manage students to add your class.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {students.map((student) => {
                  const levelData =
                    getStudentLevel(student.xp);

                  return (
                    <article
                      key={student.id}
                      className={`rounded-2xl border p-5 shadow-lg ${getRoleStyle(
                        student.role,
                      )}`}
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <div
                          className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 ${getRoleBorderStyle(
                            student.role,
                          )}`}
                        >
                          <Image
                            src={
                              roleAvatars[
                                student.role
                              ]
                            }
                            alt={`${student.role} avatar`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold ${getRoleLabelStyle(
                              student.role,
                            )}`}
                          >
                            {student.role}
                          </p>

                          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                            <h2 className="truncate text-2xl font-bold">
                              {student.name}
                            </h2>

                            <p className="text-xl font-bold text-amber-400">
                              {student.xp} XP
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-5 rounded-xl bg-slate-950/60 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-white">
                              Level{" "}
                              {
                                levelData
                                  .currentLevel
                                  .level
                              }
                            </p>

                            <p className="text-sm text-slate-400">
                              {
                                levelData
                                  .currentLevel
                                  .title
                              }
                            </p>
                          </div>

                          {levelData.nextLevel ? (
                            <p className="text-right text-xs text-slate-400">
                              {student.xp} /{" "}
                              {
                                levelData
                                  .nextLevel
                                  .requiredXP
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
                              student.role,
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
                              levelData.nextLevel
                                .level
                            }
                          </p>
                        )}
                      </div>

                      {xpActions.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          Create an XP action to begin.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {xpActions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              onClick={() =>
                                awardXP(
                                  student.id,
                                  action.amount,
                                  action.label,
                                )
                              }
                              className="rounded-xl bg-slate-900/80 p-3 text-left transition hover:bg-slate-800 active:scale-95"
                            >
                              <span className="block text-sm font-semibold">
                                {action.label}
                              </span>

                              <span
                                className={
                                  action.amount > 0
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
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Recent activity
              </h2>

              <span className="text-sm text-slate-400">
                {transactions.length} actions
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-sm text-slate-400">
                No XP has been awarded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {transactions
                  .slice(0, 10)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-xl bg-slate-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {transaction.studentName}
                          </p>

                          <p className="text-sm text-slate-400">
                            {transaction.reason}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(
                              transaction.createdAt,
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>

                        <span
                          className={
                            transaction.amount > 0
                              ? "font-bold text-emerald-400"
                              : "font-bold text-red-400"
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