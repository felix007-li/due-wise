import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { api, localToday, type Bill, type User, ApiError } from "../lib/api";
import { ErrorState, Heading, Loading } from "../components";
export const billSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  amount: z
    .string()
    .regex(
      /^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/,
      "Use a positive amount with up to four decimal places.",
    )
    .refine((v) => /[1-9]/.test(v), "Amount must be greater than zero."),
  currency: z.string().regex(/^[A-Z]{3}$/),
  firstDue: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.")
    .refine(
      (v) => v >= "2000-01-01" && v <= "2100-12-31",
      "Choose a date between 2000 and 2100.",
    ),
  recurrence: z.enum([
    "once",
    "weekly",
    "every_n_weeks",
    "monthly",
    "quarterly",
    "yearly",
  ]),
  everyNWeeks: z
    .string()
    .regex(/^\d+$/)
    .refine((v) => Number(v) >= 1 && Number(v) <= 52, "Choose 1–52 weeks."),
  monthEndPolicy: z.enum(["clamp", "last_day_of_month"]),
  category: z.string().min(1).max(40),
  subscription: z.boolean(),
  active: z.boolean(),
  reminderDays: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        (v.split(",").length <= 10 &&
          v
            .split(",")
            .every((n) => /^\s*\d{1,3}\s*$/.test(n) && Number(n) <= 365)),
      "Use up to 10 comma-separated day offsets, 0–365.",
    ),
  notes: z.string().max(2000),
});
type Fields = z.infer<typeof billSchema>;
export function Editor({
  notice,
  user,
}: {
  notice: (s: string) => void;
  user: User;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [savedVersion, setSavedVersion] = useState(0);
  const q = useQuery({
    queryKey: ["bill", id],
    queryFn: () => api<Bill>("/bills/" + id),
    enabled: !!id,
  });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<Fields>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: "",
      amount: "",
      currency: user.currency,
      firstDue: localToday(user.timezone),
      recurrence: "monthly",
      everyNWeeks: "1",
      monthEndPolicy: "clamp",
      category: "Housing",
      subscription: false,
      active: true,
      reminderDays: "3",
      notes: "",
    },
  });
  useEffect(() => {
    if (q.data) {
      const b = q.data;
      reset(
        billSchema.parse({
          ...b,
          amount: String(b.amount),
          everyNWeeks: String(b.everyNWeeks),
        }),
      );
      setSavedVersion(b.rowVersion);
    }
  }, [q.data, reset]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [isDirty]);
  const mutation = useMutation({
    mutationFn: (values: Fields) =>
      api<Bill>(id ? "/bills/" + id : "/bills", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({
          ...values,
          everyNWeeks: Number(values.everyNWeeks),
          reminderDays: values.reminderDays
            ? values.reminderDays.split(",").map(Number)
            : [],
          rowVersion: savedVersion,
        }),
      }),
    onSuccess: (b) => {
      client.invalidateQueries();
      notice(
        id
          ? "Bill updated. Unpaid dates have been recalculated."
          : "Bill added. You’re a step ahead.",
      );
      navigate("/bills/" + b.id);
    },
    onError: (e) => {
      if (e instanceof ApiError)
        Object.entries(e.fieldErrors).forEach(([name, message]) =>
          setError(name as keyof Fields, { message }),
        );
    },
  });
  if (id && q.isPending) return <Loading />;
  if (id && q.error)
    return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const fieldError = (name: keyof Fields) =>
    errors[name] ? (
      <span className="field-error" id={name + "-error"}>
        {errors[name]?.message}
      </span>
    ) : null;
  const attrs = (name: keyof Fields) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? name + "-error" : undefined,
  });
  return (
    <>
      <Link className="text-link" to="/bills">
        <ArrowLeft size={16} /> All bills
      </Link>
      <Heading
        eyebrow="A SMALL STEP TOWARD PEACE OF MIND"
        title={id ? "Edit your bill" : "Add a new commitment"}
      />
      <div className="editor-grid">
        <form
          className="card bill-form"
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          noValidate
        >
          <div className="tabs full">
            <button
              type="button"
              className={!watch("subscription") ? "selected" : ""}
              aria-pressed={!watch("subscription")}
              onClick={() =>
                setValue("subscription", false, { shouldDirty: true })
              }
            >
              Bill
            </button>
            <button
              type="button"
              className={watch("subscription") ? "selected" : ""}
              aria-pressed={watch("subscription")}
              onClick={() =>
                setValue("subscription", true, { shouldDirty: true })
              }
            >
              Subscription
            </button>
          </div>
          <label>
            Name
            <input
              autoComplete="off"
              placeholder="e.g. Rent, Hydro, Spotify"
              {...register("name")}
              {...attrs("name")}
            />
            {fieldError("name")}
          </label>
          <div className="form-row">
            <label>
              Amount
              <input
                inputMode="decimal"
                placeholder="0.00"
                {...register("amount")}
                {...attrs("amount")}
              />
              {fieldError("amount")}
            </label>
            <label>
              Currency
              <select {...register("currency")}>
                <option>CAD</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>JPY</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              First due date
              <input
                type="date"
                min="2000-01-01"
                max="2100-12-31"
                {...register("firstDue")}
                {...attrs("firstDue")}
              />
              {fieldError("firstDue")}
            </label>
            <label>
              Frequency
              <select {...register("recurrence")}>
                <option value="once">One time</option>
                <option value="weekly">Weekly</option>
                <option value="every_n_weeks">Every N weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          </div>
          {watch("recurrence") === "every_n_weeks" && (
            <label>
              Number of weeks
              <input
                type="number"
                min="1"
                max="52"
                {...register("everyNWeeks")}
              />
              {fieldError("everyNWeeks")}
            </label>
          )}
          <label>
            Category
            <select {...register("category")}>
              {[
                "Housing",
                "Utilities",
                "Internet",
                "Entertainment",
                "Insurance",
                "Transport",
                "Health",
                "Education",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Month-end handling
            <select {...register("monthEndPolicy")}>
              <option value="clamp">
                Keep anchor day, clamp in shorter months
              </option>
              <option value="last_day_of_month">
                Always use the last day of the month
              </option>
            </select>
            <small>
              For monthly, quarterly and yearly schedules. Dates always use the
              original anchor.
            </small>
          </label>
          <label>
            Remind me before the due date
            <input
              placeholder="3, 1, 0"
              {...register("reminderDays")}
              {...attrs("reminderDays")}
            />
            <small>
              Comma-separated days. Leave blank to turn reminders off. Reminders
              appear in the app.
            </small>
            {fieldError("reminderDays")}
          </label>
          <label>
            Notes <span className="muted">(optional)</span>
            <textarea
              rows={3}
              placeholder="Anything you’d like to remember…"
              {...register("notes")}
            />
            {fieldError("notes")}
          </label>
          <label className="checkbox">
            <input type="checkbox" {...register("active")} /> Active — include
            future occurrences
          </label>
          {id && (
            <p className="info-note">
              Saving recalculates unpaid occurrences. Recorded paid dates and
              amounts are preserved.
            </p>
          )}
          {mutation.error && (
            <p className="inline-error" role="alert">
              {mutation.error.message}
            </p>
          )}
          <div className="form-actions">
            <Link className="secondary button" to="/bills">
              Cancel
            </Link>
            <button disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : id
                  ? "Save changes"
                  : watch("subscription")
                    ? "Save subscription"
                    : "Save bill"}
            </button>
          </div>
        </form>
        <aside className="editor-aside">
          <span className="empty-icon">
            <ShieldCheck size={32} />
          </span>
          <h2>Only what you choose to share.</h2>
          <p>
            No bank connections. No automatic payments. Just a clear picture of
            the commitments you enter.
          </p>
          <hr />
          <h3>A note on your numbers</h3>
          <p>
            Amounts are calculated by the server and kept in their original
            currency. We never combine currencies into a misleading total.
          </p>
          <p className="muted">
            Personal planning estimates, grounded in your inputs.
          </p>
        </aside>
      </div>
    </>
  );
}
