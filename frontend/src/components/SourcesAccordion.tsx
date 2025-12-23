import * as React from "react";
import type { Source } from "../types/api";

type Props = {
    sources: Source[] | undefined;
};

export default function SourcesAccordion({ sources }: Props) {
    const [open, setOpen] = React.useState<boolean>(false);

    const list = Array.isArray(sources) ? sources : [];
    const hasSources = list.length > 0;

    return (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-medium text-slate-700"
            >
                <span>Источники</span>
                <span className="text-slate-500">{open ? "−" : "+"}</span>
            </button>

            {open ? (
                <div className="border-t border-slate-200 px-3 py-2">
                    {!hasSources ? (
                        <div className="text-xs text-slate-600">Источники не найдены</div>
                    ) : (
                        <ul className="space-y-1">
                            {list.map((s, idx) => (
                                <li key={`${s.path}:${s.start_line}:${s.end_line}:${idx}`} className="text-xs text-slate-700">
                                    <span className="font-mono">{s.path}</span>
                                    <span className="text-slate-500">
                    :{s.start_line}–{s.end_line}
                  </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}
        </div>
    );
}
