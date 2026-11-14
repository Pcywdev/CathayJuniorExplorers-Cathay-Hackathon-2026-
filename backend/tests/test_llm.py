"""services/llm.py: the only place that calls an AI. No network: a fake OpenAI client records each call."""

from types import SimpleNamespace

import openai
import pytest

from app.config import Settings
from app.services import llm
from app.services.llm import LlmUnavailable, complete_json, moderate


def settings(**kw) -> Settings:
    base = {"llm_provider": "openai", "llm_api_key": "sk-secret-key", "llm_model": "test-model"}
    return Settings(_env_file=None, **{**base, **kw})


def reply(content="{}", refusal=None, finish_reason="stop"):
    message = SimpleNamespace(content=content, refusal=refusal)
    return SimpleNamespace(choices=[SimpleNamespace(message=message, finish_reason=finish_reason)])


class FakeOpenAI:
    """Stands in for openai.OpenAI; records constructor and request arguments."""

    instances: list["FakeOpenAI"] = []
    next_reply = reply()
    next_error: Exception | None = None
    flagged = False

    def __init__(self, **kwargs):
        self.init = kwargs
        self.calls: list[dict] = []
        self.moderation_calls: list[dict] = []
        FakeOpenAI.instances.append(self)
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))
        self.moderations = SimpleNamespace(create=self._moderate)

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if FakeOpenAI.next_error:
            raise FakeOpenAI.next_error
        return FakeOpenAI.next_reply

    def _moderate(self, **kwargs):
        self.moderation_calls.append(kwargs)
        return SimpleNamespace(results=[SimpleNamespace(flagged=FakeOpenAI.flagged)])


@pytest.fixture(autouse=True)
def fake_openai(monkeypatch):
    FakeOpenAI.instances = []
    FakeOpenAI.next_reply = reply('{"ok": true}')
    FakeOpenAI.next_error = None
    FakeOpenAI.flagged = False
    monkeypatch.setattr(llm, "OpenAI", FakeOpenAI)
    return FakeOpenAI


# --- complete_json -----------------------------------------------------------

def test_request_carries_model_json_format_timeout_and_messages():
    text = complete_json("SYSTEM", "USER", settings(llm_timeout_seconds=12))

    assert text == '{"ok": true}'
    client = FakeOpenAI.instances[0]
    assert client.init["api_key"] == "sk-secret-key" and client.init["timeout"] == 12
    assert client.init.get("base_url") is None
    call = client.calls[0]
    assert call["model"] == "test-model"
    assert call["response_format"] == {"type": "json_object"}
    assert call["messages"] == [{"role": "system", "content": "SYSTEM"}, {"role": "user", "content": "USER"}]


def test_base_url_is_passed_for_compatible_providers():
    complete_json("s", "u", settings(llm_base_url="https://example.test/v1/openai/"))
    assert FakeOpenAI.instances[0].init["base_url"] == "https://example.test/v1/openai/"


@pytest.mark.parametrize("bad, why", [
    (reply(content=None, refusal="I can't help with that"), "refused"),
    (reply(content='{"partial":', finish_reason="length"), "cut off"),
    (reply(content="   "), "empty"),
    (reply(content="{}", finish_reason="content_filter"), "filtered"),
])
def test_unusable_replies_raise_with_a_reason(bad, why):
    FakeOpenAI.next_reply = bad
    with pytest.raises(LlmUnavailable, match=why):
        complete_json("s", "u", settings())


def test_sdk_errors_become_llm_unavailable_without_the_key():
    FakeOpenAI.next_error = openai.APIConnectionError(request=None)
    with pytest.raises(LlmUnavailable) as exc:
        complete_json("s", "u", settings())
    assert "sk-secret-key" not in str(exc.value)
    assert "APIConnectionError" in str(exc.value)


@pytest.mark.parametrize("kw, why", [
    ({"llm_provider": ""}, "no AI provider"),
    ({"llm_provider": "openai", "llm_model": ""}, "LLM_MODEL"),
    ({"llm_provider": "openai", "llm_api_key": ""}, "LLM_API_KEY"),
    ({"llm_provider": "bedrock"}, "unknown"),
])
def test_missing_configuration_raises_before_any_call(kw, why):
    with pytest.raises(LlmUnavailable, match=why):
        complete_json("s", "u", settings(**kw))
    assert FakeOpenAI.instances == []


def test_fake_provider_returns_a_story_without_any_client():
    text = complete_json("s", "u", settings(llm_provider="fake", llm_api_key="", llm_model=""))
    assert '"chapters"' in text
    assert FakeOpenAI.instances == []


# --- moderate ----------------------------------------------------------------

def test_moderation_runs_on_openai_itself():
    assert "passed" in moderate("A happy story.", settings())
    assert FakeOpenAI.instances[0].moderation_calls[0]["input"] == "A happy story."


def test_flagged_text_raises():
    FakeOpenAI.flagged = True
    with pytest.raises(LlmUnavailable, match="moderation"):
        moderate("text", settings())


def test_moderation_is_skipped_for_compatible_providers_and_fake():
    assert "skipped" in moderate("text", settings(llm_base_url="https://example.test/v1/"))
    assert "skipped" in moderate("text", settings(llm_provider="fake"))
    assert FakeOpenAI.instances == []
