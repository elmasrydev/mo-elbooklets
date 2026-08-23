#!/usr/bin/env python3
"""Pre-store-build gate: does the target backend actually have the fields we select?

A GraphQL operation that selects an unknown field fails *entirely* — not the
field, the whole query. So a build whose documents run against PRS can take the
matching screen down completely on an environment one deploy behind, and the
app is only found broken after release. Two of those have already happened here
(`mindMapMimeType`, then the trial fields), which is why this is a script and
not a habit.

    python3 scripts/check_release_fields.py                 # production
    python3 scripts/check_release_fields.py --url <graphql> # any environment

Exits non-zero — and names the missing fields — when the target is behind.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request

PROD_URL = "https://elbooklets.com/graphql"

# Fields whose absence takes a screen down: they are selected by documents the
# app cannot work without, and one missing field fails the whole operation.
# A miss here blocks the build.
REQUIRED_FIELDS = {
    "User": ["is_subscribed"],
    "Lesson": ["isLocked", "mindMapUrl", "mindMapMimeType"],
}

# Fields the app selects in an *isolated* query built to tolerate their absence
# (`trial.graphql`): missing them costs the feature, not the app. Reported, but
# they do not fail the build — a gate that is red on day one gets ignored, and
# then it is ignored for the fields above too.
DEGRADING_FIELDS = {
    "User": [
        "on_trial",
        "trial_ends_at",
        "trial_days_remaining",
        "daily_quiz_limit",
        "remaining_quizzes_today",
    ],
}

INTROSPECTION = 'query ($name: String!) { __type(name: $name) { fields { name } } }'


def type_fields(url: str, type_name: str) -> set:
    body = json.dumps({"query": INTROSPECTION, "variables": {"name": type_name}}).encode()
    request = urllib.request.Request(url, data=body, method="POST")
    request.add_header("Content-Type", "application/json")
    request.add_header("Accept", "application/json")
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode())
    node = (payload.get("data") or {}).get("__type")
    if not node:
        raise RuntimeError(f"{type_name}: {payload.get('errors') or 'type not found'}")
    return {field["name"] for field in node["fields"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=PROD_URL, help=f"GraphQL endpoint (default: {PROD_URL})")
    args = parser.parse_args()

    print(f"Checking fields against {args.url}\n")

    available = {}
    for type_name in set(REQUIRED_FIELDS) | set(DEGRADING_FIELDS):
        try:
            available[type_name] = type_fields(args.url, type_name)
        except (urllib.error.URLError, RuntimeError, KeyError) as error:
            print(f"❌ {type_name}: could not introspect ({error})")
            return 2

    blocking = False
    for type_name, fields in REQUIRED_FIELDS.items():
        absent = [f for f in fields if f not in available[type_name]]
        if absent:
            blocking = True
            print(f"❌ {type_name}: missing {', '.join(absent)}")
        else:
            print(f"✅ {type_name}: all {len(fields)} required fields present")

    for type_name, fields in DEGRADING_FIELDS.items():
        absent = [f for f in fields if f not in available[type_name]]
        if absent:
            print(f"⚠️  {type_name}: missing {', '.join(absent)}")
            print("    Its own query fails and the app hides the feature — not a blocker.")
        else:
            print(f"✅ {type_name}: all {len(fields)} optional fields present")

    if blocking:
        print("\nDo NOT ship a store build against this environment — a query")
        print("selecting a missing required field fails in full, it does not degrade.")
        return 1

    print("\nEvery field the app cannot work without is deployed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
