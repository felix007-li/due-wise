import { Landscape } from "../Landscape";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Leaf, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { api, type User } from "../lib/api";
export function Auth({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      api<User>("/auth/" + mode, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess,
  });
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={32} />
          </span>
          <span>
            DueWise<small>Bills & subscriptions</small>
          </span>
        </div>
        <div>
          <p className="eyebrow">LESS SURPRISE. MORE PEACE OF MIND.</p>
          <h1>
            Make room
            <br />
            for a calmer
            <br />
            <em>financial life.</em>
          </h1>
          <p>
            Your bills, subscriptions, and a clear view of what’s ahead. All in
            one thoughtful little place.
          </p>
        </div>
        <div className="landscape" aria-hidden="true">
          <div className="sun" />
          <div className="mountain back" />
          <div className="mountain front" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div className={"tree tree-" + i} key={i} />
          ))}
        </div>
        <span className="auth-foot">
          Stay on top of your bills. Get back to living.
        </span>
      </section>
      <main
        className={
          "auth-panel " + (mode === "welcome" ? "welcome-mode" : "signin-mode")
        }
      >
        <div className="auth-content">
          <span className="brand-mark">
            <Leaf size={32} />
          </span>
          {mode === "welcome" ? (
            <>
              <div className="welcome-wordmark">
                <h1>DueWise</h1>
                <p>Bills &amp; Subscriptions</p>
              </div>
              <p className="welcome-description">
                A simple way to manage
                <br />
                your bills and subscriptions.
              </p>
              <Landscape />
              <div className="onboard-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <button className="wide" onClick={() => setMode("register")}>
                Get started <ArrowRight size={18} />
              </button>
              <button
                className="secondary wide"
                onClick={() => setMode("login")}
              >
                I already have an account
              </button>
              <p className="privacy-promise">
                <ShieldCheck size={17} /> No bank connection. Your data stays
                yours.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">
                {mode === "login"
                  ? "GOOD TO SEE YOU AGAIN"
                  : "YOUR CALMER ROUTINE STARTS HERE"}
              </p>
              <h2>
                {mode === "login" ? "Welcome back." : "Let’s get you settled."}
              </h2>
              <p>
                {mode === "login"
                  ? "Sign in to your DueWise account."
                  : "Create your free DueWise account."}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
              >
                <label>
                  Email address
                  <input
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <div className="password-input">
                    <input
                      required
                      type={show ? "text" : "password"}
                      minLength={12}
                      maxLength={72}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      value={password}
                      placeholder="At least 12 characters"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                {mutation.error && (
                  <p role="alert" className="inline-error">
                    {mutation.error.message}
                  </p>
                )}
                <button className="wide" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>
              <p className="auth-switch">
                {mode === "login"
                  ? "New to DueWise?"
                  : "Already have an account?"}{" "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    mutation.reset();
                  }}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
          <p className="legal-caption">
            Personal planning estimates. No banking integrations or automatic
            payments.
          </p>
        </div>
      </main>
    </div>
  );
}
