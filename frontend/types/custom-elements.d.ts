// types/custom-elements.d.ts

import React from "react"

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "shadow-vote-widget": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            > & {
                "poll-id"?: string
                theme?: string
            }
        }
    }
}

export { }
