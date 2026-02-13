from typing import Any


def evaluate_rules(event: dict[str, Any], rules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    actions: list[dict[str, Any]] = []
    for rule in rules:
        condition = rule.get("condicao", {})
        action = rule.get("acao", {})
        event_type = condition.get("tipo")
        min_attempts = condition.get("tentativas_min", 0)
        if event_type and event.get("tipo") != event_type:
            continue
        attempts = int(event.get("payload", {}).get("tentativas", 0))
        if attempts >= min_attempts:
            actions.append(action)
    return actions
