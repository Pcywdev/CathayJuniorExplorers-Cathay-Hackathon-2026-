"""The only place that calls an AI. One provider shape: the openai SDK.

LLM_PROVIDER:
  ""       no AI: every call raises LlmUnavailable, so the caller uses the pre-written story
  "fake"   canned output for tests and dev (the pre-written story), no network
  "openai" the openai SDK: OpenAI itself, or an OpenAI-compatible provider via LLM_BASE_URL

Every failure becomes LlmUnavailable with a short reason. The API key never appears in it.
"""

import openai
from openai import OpenAI

from app.config import Settings


class LlmUnavailable(RuntimeError):
    """No usable answer from the AI. The message is safe to log (no key, no prompt)."""


def complete_json(system: str, user: str, settings: Settings) -> str:
    """Ask for a JSON reply. Returns the raw text; parsing and safety checks are the caller's."""
    provider = settings.llm_provider
    if provider == "fake":
        return _fake_story(settings)
    client = _client(settings)
    try:
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            response_format={"type": "json_object"},
        )
    except openai.OpenAIError as exc:
        raise LlmUnavailable(f"AI call failed: {type(exc).__name__}") from None

    choice = response.choices[0]
    message = choice.message
    if getattr(message, "refusal", None):
        raise LlmUnavailable("AI refused the request")
    if choice.finish_reason == "length":
        raise LlmUnavailable("AI reply was cut off (too long)")
    if choice.finish_reason == "content_filter":
        raise LlmUnavailable("AI reply was filtered by the provider")
    if not (message.content or "").strip():
        raise LlmUnavailable("AI reply was empty")
    return message.content


def moderate(text: str, settings: Settings) -> str:
    """Provider moderation pass. Only OpenAI itself has the endpoint; others are skipped."""
    if settings.llm_provider != "openai" or settings.llm_base_url:
        return "moderation skipped (provider has no moderation endpoint)"
    client = _client(settings)
    try:
        result = client.moderations.create(input=text)
    except openai.OpenAIError as exc:
        raise LlmUnavailable(f"moderation call failed: {type(exc).__name__}") from None
    if any(r.flagged for r in result.results):
        raise LlmUnavailable("story flagged by moderation")
    return "moderation passed"


def _client(settings: Settings) -> OpenAI:
    provider = settings.llm_provider
    if not provider:
        raise LlmUnavailable("no AI provider configured (LLM_PROVIDER is empty)")
    if provider != "openai":
        raise LlmUnavailable(f"unknown provider {provider!r} (use 'openai' or 'fake')")
    if not settings.llm_model:
        raise LlmUnavailable("LLM_MODEL is not set")
    if not settings.llm_api_key:
        raise LlmUnavailable("LLM_API_KEY is not set")
    kwargs = {"api_key": settings.llm_api_key, "timeout": settings.llm_timeout_seconds}
    if settings.llm_base_url:
        kwargs["base_url"] = settings.llm_base_url
    return OpenAI(**kwargs)


def _fake_story(settings: Settings) -> str:
    return (settings.fixtures_dir / "stories" / "fallback.json").read_text(encoding="utf-8")
