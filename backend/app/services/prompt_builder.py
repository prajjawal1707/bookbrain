from typing import List, Dict, Optional

REASONING_CHAINS = {
    "standard":      ["1. ASSESS: What is the true nature of this situation?",
                      "2. SCAN: Which loaded principles apply here?",
                      "3. EVALUATE: What are the power dynamics and stakes?",
                      "4. CALIBRATE: Any risks or ethics to flag?",
                      "5. RESPOND: Most strategically sound answer."],
    "tactical":      ["1. THREAT/OPPORTUNITY: Is this a threat or opportunity?",
                      "2. PRINCIPLE MATCH: Which rule applies most directly?",
                      "3. STAKEHOLDER MAP: Who benefits, who loses?",
                      "4. ACT: Choose the response that maximises the objective."],
    "advisory":      ["1. LISTEN DEEPLY: What is truly being asked beneath the surface?",
                      "2. PRINCIPLE SELECTION: Which principles illuminate this?",
                      "3. SCENARIO MODEL: What are 2-3 paths forward?",
                      "4. WISDOM CHECK: Does my advice align with the framework?",
                      "5. DELIVER: Clear, actionable, principled guidance."],
    "socratic":      ["1. QUESTION: What assumptions underlie this request?",
                      "2. PRINCIPLE: Which philosophical truth applies?",
                      "3. CHALLENGE: What is the person not seeing?",
                      "4. GUIDE: Lead them to their own insight."],
}

SYSTEM_PROMPT_TEMPLATE = """You are {persona}, operating according to the strategic philosophy of "{book_title}".

## PHILOSOPHICAL FRAMEWORK
{worldview}

## DECISION-MAKING MODEL
{decision_model}

## ACTIVE PRINCIPLES ({count} loaded)
{principles_block}

## BEHAVIORAL GUIDELINES
{guidelines_block}

## CAUTIONS
{cautions_block}

## REASONING CHAIN (run before every response)
{reasoning_chain}

Tone: {tone}. Be precise, principled, and strategically grounded in every answer."""


class PromptBuilder:

    def _principles_block(self, principles: List[Dict], selected: Optional[List[str]] = None) -> str:
        src = principles
        if selected:
            src = [p for p in principles if p.get("principle_name", "").lower()
                   in [s.lower() for s in selected]]
        src = src[:12]
        lines = []
        for i, p in enumerate(src, 1):
            name    = p.get("principle_name", f"Principle {i}")
            insight = p.get("core_insight", p.get("description", ""))
            risk    = p.get("risk_level", "medium").upper()
            apply   = p.get("when_to_apply", [])
            lines.append(f"**{i}. {name}** [{risk} RISK]")
            lines.append(f"   → {insight}")
            if apply:
                lines.append(f"   Apply when: {'; '.join(apply[:2])}")
            lines.append("")
        return "\n".join(lines) or "No principles loaded."

    def build_system_prompt(self, package: Dict, persona: str = "strategic advisor",
                             tone: str = "direct", selected: Optional[List[str]] = None,
                             reasoning_style: str = "advisory") -> str:
        fw = package.get("philosophical_framework", {})
        tone_to_style = {"formal": "standard", "conversational": "advisory",
                         "socratic": "socratic", "direct": "tactical"}
        r_style = tone_to_style.get(tone, reasoning_style)
        chain   = "\n".join(REASONING_CHAINS.get(r_style, REASONING_CHAINS["advisory"]))
        return SYSTEM_PROMPT_TEMPLATE.format(
            persona        = persona,
            book_title     = package.get("book_title", "Unknown"),
            worldview      = fw.get("worldview", "Strategic and pragmatic."),
            decision_model = fw.get("decision_making_model", "Calculate all outcomes."),
            count          = len(package.get("principles", [])),
            principles_block = self._principles_block(package.get("principles", []), selected),
            guidelines_block = "\n".join(f"• {g}" for g in package.get("behavioral_guidelines", [])),
            cautions_block   = "\n".join(f"⚠ {c}" for c in package.get("cautions", [])),
            reasoning_chain  = chain,
            tone           = tone,
        )

    def build_instruction_template(self, package: Dict) -> str:
        title = package.get("book_title", "this philosophy")
        top   = [p.get("principle_name", "") for p in package.get("principles", [])[:5] if p.get("principle_name")]
        return (
            f"## Instruction Template — {title}\n\n"
            f"SYSTEM: You are an advisor grounded in the principles of {title}.\n"
            f"Active principles: {', '.join(top)}.\n\n"
            "USER: [INSERT SITUATION HERE]\n\n"
            "EXPECTED FORMAT:\n"
            "**Relevant Principle:** [Name]\n"
            "**Analysis:** [2-3 sentences applying the principle]\n"
            "**Recommended Action:** [Concrete steps]\n"
            "**Risk Assessment:** [Potential downsides]"
        )

    def build_example_interaction(self, package: Dict) -> Dict:
        top = (package.get("principles") or [{}])[0]
        return {
            "user": "I'm being overlooked for a promotion despite doing better work. What should I do?",
            "assistant_thinking": [
                "Assessing workplace power dynamics...",
                f"Relevant principle: {top.get('principle_name', 'Strategic Positioning')}",
                "Formulating principled, long-term advice...",
            ],
            "assistant_response": (
                f"Based on '{top.get('principle_name', 'strategic positioning')}': "
                f"{top.get('core_insight', 'Position matters as much as performance.')} "
                "Make contributions visible before meetings, document wins, and build lateral alliances. "
                "Performance is necessary but not sufficient — perception is the real lever."
            ),
        }

    def estimate_tokens(self, text: str) -> int:
        return len(text) // 4
