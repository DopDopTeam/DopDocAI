import * as React from "react";

type Props = {
    left: React.ReactNode;
    right: React.ReactNode;
};

export default function Layout({ left, right }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-7xl p-4 md:p-6">
                <header className="mb-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-lg font-semibold tracking-tight">GitHub Repository RAG</h1>
                        <span className="text-xs text-slate-500">MVP</span>
                    </div>
                    <div className="text-xs text-slate-500">/api</div>
                </header>

                <main className="grid gap-4 md:grid-cols-[360px_1fr]">
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-4">{left}</div>
                    </section>

                    <section className="min-h-[60vh] rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex h-full flex-col p-4">{right}</div>
                    </section>
                </main>

                <footer className="mt-6 text-xs text-slate-500">
                    Ответы отображаются строго по контексту репозитория, с источниками.
                </footer>
            </div>
        </div>
    );
}
