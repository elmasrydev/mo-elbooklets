# Generating a Quiz — Question Type Selection (GraphQL)

Guide for the mobile client covering the quiz setup screen: how to offer question
types, how many questions each type actually has, and how to stop a student
asking for a quiz that cannot be built.

Companion to [New Question Types — Paragraph / Image / Match](./mobile-question-types-paragraph-image-match.md),
which covers rendering and answering the questions once the quiz exists.

Everything described here is live on the API — no backend work is pending.

---

## 1. Two ways to generate a quiz

| Mode | What you send | What the student gets |
| ---- | ------------- | --------------------- |
| **Default** (unchanged behaviour) | omit `questionTypes` | A random mix of every type the lessons hold |
| **Custom** | `questionTypes: ["mcq", "image"]` | Only those types |

The default is the fallback for everything: omit the argument, send `null`, send
an empty list, or send *every* type — all four mean "no restriction". Keep
"surprise me" as the default option on the setup screen.

A custom selection must contain **at least 2 types** (`minSelectedTypes`, see
below). A one-type quiz is a drill, not a quiz, and the server rejects it.

---

## 2. Step one — ask what the lessons hold

Call this **after** the student picks lessons and **before** you render the type
picker.

```graphql
query LessonQuestionTypes($lessonIds: [ID!]!) {
  lessonQuestionTypes(lessonIds: $lessonIds) {
    total
    minSelectedTypes
    types {
      type      # send this value back in startQuiz
      label     # localised, ready to display
      count     # questions available for this type
    }
  }
}
```

```json
{
  "data": {
    "lessonQuestionTypes": {
      "total": 96,
      "minSelectedTypes": 2,
      "types": [
        { "type": "mcq",        "label": "Multiple Choice",   "count": 61 },
        { "type": "true_false", "label": "True / False",      "count": 24 },
        { "type": "image",      "label": "Picture Questions", "count": 7  },
        { "type": "match",      "label": "Match the Columns", "count": 4  }
      ]
    }
  }
}
```

### The rules

- **Render only what comes back.** A type with no questions is omitted from
  `types` entirely — it is never returned with `count: 0`. Do not pad the list
  from a hard-coded set of seven types; that is the bug this query exists to fix.
- **`count` is per selected lesson set.** Re-run the query whenever the lesson
  selection changes. Counts are summed across the lessons you pass.
- **`label` follows the request locale.** Send the `lang: ar` / `lang: en` header
  you already send elsewhere. If you prefer your own strings, key them off `type`
  and ignore `label`.
- **`total`** is the sum of every listed `count` — what a default (all types)
  quiz can draw on.
- **`minSelectedTypes`** is the minimum size of a custom selection. Read it from
  the response rather than hard-coding `2`.

### What is counted

The counts are exactly the pool the quiz builder draws from, so they never
promise more than a quiz can deliver:

- Only **top-level** questions. A paragraph counts as **one**, no matter how many
  sub-questions it holds.
- Questions with an **unresolved report** against them are excluded.
- **`image` is a category, not a `type` value** — a picture question is an
  `mcq` / `true_false` row carrying an image. It is counted under `image` and
  *not* under `mcq`, so the buckets never double-count. This matches how the quiz
  serves them: choosing `mcq` gives text-only multiple choice, choosing `image`
  gives the picture questions.
- **`what_happens` / `give_a_reason`** (descriptive, AI-graded) are only ever
  offered for **science** subjects. Expect them to be absent everywhere else.

---

## 3. Step two — validate the quiz size before starting

Quiz sizes come from `quizTypes`:

```graphql
query { quizTypes { id name question_count is_default } }
```

The rule, run on the client as the student toggles types:

```
available = Σ count of the types the student selected
needed    = question_count of the selected quizType

if (available < needed) → block "Start" and show the shortfall
```

Example: a 50-question quiz with `match` (4) and `paragraph` (3) selected across
several lessons gives `available = 7 < 50`, so the student is told immediately —
before any mutation — that there are not enough questions.

For the **default** mode, validate against `total` instead.

> **A paragraph is one question here, but many units at scoring time.** A
> 10-question quiz built from paragraphs draws 10 paragraph questions, and
> `totalQuestions` in the results comes back much larger because it counts units
> (see §5 of the companion doc). The availability check is about *drawing* the
> questions, not about the final score denominator.

---

## 4. Step three — start the quiz

```graphql
mutation StartQuiz($subjectId: ID!, $lessonIds: [ID!]!, $quizTypeId: ID, $questionTypes: [String!]) {
  startQuiz(
    subjectId: $subjectId
    lessonIds: $lessonIds
    quizTypeId: $quizTypeId
    calculateTime: true
    questionTypes: $questionTypes    # omit entirely for the default mix
  ) {
    id
    name
  }
}
```

Then fetch it with `quiz(quizId:)` exactly as before — the selection changes
*which* questions are served, not their shape.

Notes:

- The selection is **stored on the quiz**. Asking for the same lessons with a
  different type selection produces a *different* quiz rather than handing back
  an earlier all-types one.
- Order does not matter; duplicates are ignored.
- The types you send must come from the `type` values above. Anything else is
  rejected.

---

## 5. Errors you must handle

| When | Message |
| ---- | ------- |
| Fewer than `minSelectedTypes` selected | "Please choose at least 2 question types." |
| A type value the server does not know | "Unknown question types: …" |
| Custom selection too small for the quiz size | "The types you chose have only 7 questions, but this quiz needs 50. Pick more types, add lessons, or choose a shorter quiz." |
| Default mode, not enough questions at all | "There are not enough questions in the question bank for the selected lessons…" |
| A locked lesson in `lessonIds` | "Lesson '…' is locked. Please upgrade your plan to access it." |

All are localised by the `lang` header and safe to show verbatim. The
size-shortfall message is the server's backstop for a stale screen — if your
client validates as described in §3, the student should never see it.

---

## 6. Suggested screen flow

1. Student picks lessons.
2. `lessonQuestionTypes(lessonIds:)` → render the picker from `types`, each row
   showing `label` and `count`.
3. Default state: **all** returned types selected (equivalent to the classic
   random quiz). Let the student narrow it down.
4. If `types.length < minSelectedTypes` (0 or 1 type available), **hide the
   picker** and omit `questionTypes` — there is nothing to choose between, and a
   one-type selection would be rejected.
5. On every toggle, re-run the §3 check and enable/disable "Start" accordingly.
6. If the lesson selection changes, re-run the query and drop any selected type
   that is no longer available.

---

## 7. Integration checklist

- [ ] Never render a type that `lessonQuestionTypes` did not return.
- [ ] Re-query whenever the lesson selection changes.
- [ ] Show `count` next to every type.
- [ ] Enforce `minSelectedTypes` from the response, not a constant.
- [ ] Omit `questionTypes` for the default mix — do not send all seven types explicitly (same result, more code).
- [ ] Block "Start" when Σ selected counts < the quiz size, and say by how much.
- [ ] Send the `lang` header so `label` and error messages come back localised.
- [ ] Still handle the server-side shortfall error — screens go stale.
