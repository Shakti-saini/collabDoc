import Link from "next/link";
import { ArrowRight, Wifi, WifiOff, History, Users, Shield, Zap, GitBranch, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">CollabDocs</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signin"><Button variant="ghost">Sign In</Button></Link>
            <Link href="/auth/signup"><Button>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-sm font-medium px-4 py-2 rounded-full mb-8">
          <Zap className="w-4 h-4" />
          Local-First • Real-Time • Offline-Ready
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Documents that work<br />even without internet
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          A collaborative editor built on local-first architecture. Edit offline, sync automatically, resolve conflicts deterministically — your work is never lost.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup"><Button size="lg" className="gap-2">Start Writing Free <ArrowRight className="w-5 h-5" /></Button></Link>
          <Link href="/auth/signin"><Button size="lg" variant="outline">Sign In</Button></Link>
        </div>
      </section>

      {/* Features */}
     <section className="max-w-7xl mx-auto px-6 py-16">
  <div className="grid md:grid-cols-3 gap-8">
    {[
      {
        title: "Offline First",
        desc: "Full editing capability without any network connection. Every keystroke saved locally using IndexedDB with Yjs CRDTs.",
      },
      {
        title: "Smart Sync",
        desc: "Background sync engine queues changes and pushes when connectivity returns. Zero data loss, deterministic conflict resolution.",
      },
      {
        title: "Version Time Travel",
        desc: "Capture named snapshots and restore to any past state. Full version history with diff visualization.",
      },
      {
        title: "Real-time Collaboration",
        desc: "See collaborator cursors in real-time via WebSocket. Granular roles: Owner, Editor, Viewer.",
      },
      {
        title: "Enterprise Security",
        desc: "JWT auth, Row-Level Security in PostgreSQL, payload size limits, and malformed data rejection.",
      },
      {
        title: "AI-Powered Writing",
        desc: "AI writing assistant, auto-summarization, smart suggestions, and grammar improvements via OpenAI integration.",
      },
    ].map(({ title, desc }) => (
      <div
        key={title}
        className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
      >
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    ))}
  </div>
</section>

      {/* Offline demo banner */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg">
              <WifiOff className="w-5 h-5" /> Offline
            </div>
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg">
              <Wifi className="w-5 h-5" /> Back Online — Syncing...
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Connection-agnostic editing</h3>
            <p className="text-muted-foreground text-sm">The editor seamlessly transitions between offline and online states. Your changes are always preserved.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Built with Next.js 15, Yjs, TipTap, PostgreSQL & Tailwind CSS</p>
          <div className="flex gap-4">
            <span>Developer: Shakt Saini</span>
            <a href="https://github.com/Shakti-saini/" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://in.linkedin.com/in/shakti-saini-5090111ab" className="hover:text-foreground transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
