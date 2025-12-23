import * as React from "react";
import type { ChatMessage } from "../types/api";
import SourcesAccordion from "./SourcesAccordion";

type Props = {
    messages: ChatMessage[];
};

function roleLabel(role: ChatMessage["role"]): string {
    return role === "user" ? "Вы" : "Ассистент";
}

export default function MessageList({ messages }: Props) {
    const bottomRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                История пуста. Задайте вопрос по репозиторию.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
            <div className="space-y-3">
                {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                        <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                            <div className={["max-w-[92%] md:max-w-[78%] rounded-xl border px-3 py-2",
                                isUser ? "border-slate-200 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"
                            ].join(" ")}>
                                <div className={["mb-1 text-[11px] opacity-80", isUser ? "text-slate-200" : "text-slate-500"].join(" ")}>
                                    {roleLabel(m.role)}
                                </div>
                                <div className={["whitespace-pre-wrap text-sm leading-relaxed", isUser ? "text-white" : "text-slate-900"].join(" ")}>
                                    {m.content}
                                </div>

                                {/* Sources ALWAYS for assistant messages */}
                                {m.role === "assistant" ? <SourcesAccordion sources={m.sources} /> : null}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
