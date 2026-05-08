from fastapi import APIRouter, HTTPException
from app.models.schemas import GeneratePromptRequest
from app.services.prompt_builder import PromptBuilder, REASONING_CHAINS
from app.services.package_store import store

router  = APIRouter()
builder = PromptBuilder()


@router.post("/")
async def generate_prompt(req: GeneratePromptRequest):
    # Resolve the package
    if req.behavior_package_id:
        package = store.get(req.behavior_package_id)
        if not package:
            raise HTTPException(404, f"Package '{req.behavior_package_id}' not found. Run /analyze-book first.")
    elif req.raw_package:
        package = req.raw_package
    else:
        raise HTTPException(400, "Provide 'behavior_package_id' or 'raw_package'.")

    tone_to_style = {
        "formal": "standard", "conversational": "advisory",
        "socratic": "socratic", "direct": "tactical",
    }
    r_style = tone_to_style.get(req.tone, "advisory")

    system_prompt = builder.build_system_prompt(
        package=package,
        persona=req.persona,
        tone=req.tone,
        selected=req.selected_principles,
        reasoning_style=r_style if req.include_reasoning_steps else "standard",
    )

    return {
        "status": "success",
        "generated_prompt": {
            "system_prompt":        system_prompt,
            "instruction_template": builder.build_instruction_template(package),
            "reasoning_chain":      REASONING_CHAINS.get(r_style, []),
            "persona_description":  (
                f"An AI {req.persona} operating under the principles of "
                f"'{package.get('book_title', 'this framework')}'"
            ),
            "example_interaction":  builder.build_example_interaction(package),
            "token_estimate":       builder.estimate_tokens(system_prompt),
        },
        "package_summary": {
            "book_title":       package.get("book_title"),
            "principles_loaded": len(package.get("principles", [])),
        },
    }
