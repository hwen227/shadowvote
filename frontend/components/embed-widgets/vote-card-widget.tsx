// frontend/web-components/shadow-vote-widget.tsx
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Check, ExternalLink } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// 类型定义
type VoteOption = { id: string; text: string };
type VoteData = {
    id: string;
    title: string;
    description: string;
    options: VoteOption[];
};

// 真正的 React 组件
function ShadowVoteWidgetContent({ voteId, theme = "dark" }: { voteId: string, theme?: "dark" | "light" }) {
    const [vote, setVote] = useState<VoteData | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
    const [submitted, setSubmitted] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const currentAccount = useCurrentAccount();



    // Fetch vote data
    useEffect(() => {
        // Simulate fetching vote data
        setTimeout(() => {
            // This would be replaced with an actual API call
            const mockVote: VoteData = {
                id: voteId,
                title: "Cat Party or Dog Party?",
                description: "Do you like cats or dogs?",
                options: [
                    { id: "1", text: "Cat" },
                    { id: "2", text: "Dog" },
                    { id: "3", text: "Don't like either" },
                    { id: "4", text: "I want both" },
                ],
            }
            setVote(mockVote)
            setLoading(false)
        }, 1000)
    }, [voteId])

    // Handle vote submission
    const handleSubmit = () => {
        if (!selectedOption) return

        setSubmitting(true)

        // Simulate API call to submit vote
        setTimeout(() => {
            // This would be replaced with an actual API call
            setSubmitted(true)
            setSubmitting(false)
        }, 1000)
    }

    // Determine theme classes
    const themeClasses = {
        container: theme === "dark" ? "bg-black text-white" : "bg-white text-gray-900",
        border: theme === "dark" ? "border-purple-900/50" : "border-purple-300",
        button:
            theme === "dark"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-500 hover:bg-purple-600 text-white",
        radio: theme === "dark" ? "border-purple-500 text-purple-500" : "border-purple-400 text-purple-500",
        link: theme === "dark" ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-500",
        muted: theme === "dark" ? "text-gray-400" : "text-gray-500",
    }


    if (loading) {
        return (
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.container}`}>
                <div className="flex justify-center items-center h-40">
                    <div className="animate-pulse flex space-x-2">
                        <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentAccount) {
        return (
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.container}`}>
                <div className="text-red-500 text-center">
                    <p>Please connect your wallet to vote</p>
                </div>
            </div>
        )
    }


    if (error) {
        return (
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.container}`}>
                <div className="text-red-500 text-center">
                    <p>Error loading vote: {error}</p>
                </div>
            </div>
        )
    }

    if (!vote) {
        return (
            <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.container}`}>
                <div className="text-center">
                    <p>Vote not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.container}`}>
            {/* Branding header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-purple-400" />
                    <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
                        ShadowVote
                    </span>
                </div>
                <a
                    href={`${typeof window !== "undefined" ? window.location.origin : ""}/votes/${voteId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs flex items-center ${themeClasses.link}`}
                >
                    View on ShadowVote
                    <ExternalLink className="w-3 h-3 ml-1" />
                </a>
            </div>
            {/* Vote content */}
            <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">{vote.title}</h3>
                <p className={`text-sm mb-4 ${themeClasses.muted}`}>{vote.description}</p>

                {submitted ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-6 h-6 text-green-400" />
                        </div>
                        <h4 className="text-lg font-medium mb-2">Vote Submitted!</h4>
                        <p className={`text-sm ${themeClasses.muted}`}>Thank you for participating</p>
                    </div>
                ) : (
                    <>
                        <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} className="space-y-3 mb-4">
                            {vote.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id} id={`option-${option.id}`} className={themeClasses.radio} />
                                    <label htmlFor={`option-${option.id}`} className="text-sm font-medium leading-none">
                                        {option.text}
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>

                        <Button
                            className={`w-full ${themeClasses.button}`}
                            onClick={handleSubmit}
                            disabled={!selectedOption || submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Vote"}
                        </Button>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="text-center">
                <p className={`text-xs ${themeClasses.muted}`}>
                    Powered by{" "}
                    <a
                        href={typeof window !== "undefined" ? window.location.origin : ""}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={themeClasses.link}
                    >
                        ShadowVote
                    </a>
                </p>
            </div>

        </div>
    );
}

// 注册 Web Component
class ShadowVoteWidget extends HTMLElement {
    shadow: ShadowRoot;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }
    async connectedCallback() {



        const container = document.createElement("div");
        const style = document.createElement("style");
        const css = await fetch("/vote-widget/widget.css").then((res) =>
            res.text()
        );
        style.textContent = css;

        this.shadow.appendChild(style);
        this.shadow.appendChild(container);


        const voteId = this.getAttribute("poll-id") || "default";
        const theme = (this.getAttribute("theme") as "dark" | "light") || "dark"
        const root = createRoot(container);
        root.render(<ShadowVoteWidgetContent voteId={voteId} theme={theme} />);
    }
}

customElements.define("shadow-vote-widget", ShadowVoteWidget);
