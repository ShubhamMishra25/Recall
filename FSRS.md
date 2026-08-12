# The Goal of FSRS

FSRS is trying to answer:

> "When is the optimal time to show this card again so that I remember it with a desired probability?"

Traditional Anki scheduling uses fixed rules.

FSRS builds a memory model for every card.

---

# Concept 1: Stability (S)

**Stability = How long you can remember something.**

Example:

### Card A

```text
Capital of France?
→ Paris
```

You've seen it 50 times.

You could probably remember it after 3 months.

Stability:

```text
90 days
```

---

### Card B

```text
New React Hook
```

Learned yesterday.

You'd forget it tomorrow.

Stability:

```text
1 day
```

---

Higher stability means:

```text
More stable memory
↓
Longer intervals
```

---

# Concept 2: Difficulty (D)

**Difficulty = How hard this card is for YOU.**

Not globally.

For example:

```text
What is 2 + 2?
```

Difficulty:

```text
1/10
```

---

```text
Explain transformers architecture.
```

Difficulty:

```text
8/10
```

---

Two people may have different difficulty values.

A React developer:

```text
React hooks
Difficulty = 2
```

A beginner:

```text
React hooks
Difficulty = 8
```

---

# Concept 3: Retrievability (R)

This is the most important one.

Retrievability means:

> "If I asked you RIGHT NOW, what's the probability you'd remember?"

Example:

Immediately after learning:

```text
R = 100%
```

---

After 1 week:

```text
R = 80%
```

---

After 1 month:

```text
R = 40%
```

---

Retrievability constantly falls.

Like this:

```text
100%
 |
90%
 |
70%
 |
50%
 |
30%
 |
 +---------------->
        Time
```

This is the forgetting curve.

---

# How FSRS Uses Them

FSRS stores:

```text
Card
├── Stability
├── Difficulty
└── Retrievability
```

When you review:

```text
Again
Hard
Good
Easy
```

FSRS updates those values.

---

# Example

Day 1

```text
Atom:
"React useMemo memoizes expensive calculations"

Difficulty = 6
Stability = 1 day
```

---

Tomorrow:

You remember it.

Press:

```text
Good
```

FSRS thinks:

```text
Memory is stronger than before
```

Updates:

```text
Stability = 4 days
```

---

Four days later:

Again:

```text
Good
```

Updates:

```text
Stability = 12 days
```

---

Twelve days later:

```text
Easy
```

Updates:

```text
Stability = 35 days
```

---

Intervals keep growing.

---

# Again / Hard / Good / Easy

These ratings tell FSRS how the review went.

### Again

```text
I forgot it.
```

Effect:

```text
Stability ↓↓↓
```

Review again soon.

---

### Hard

```text
Barely remembered.
```

Effect:

```text
Small increase
```

---

### Good

```text
Remembered normally.
```

Effect:

```text
Normal increase
```

---

### Easy

```text
Instant recall.
```

Effect:

```text
Big increase
```

---

# Desired Retention

This is a target memory probability.

Most people use:

```text
90%
```

Meaning:

> Schedule cards so I have about a 90% chance of remembering.

---

Higher retention:

```text
95%
```

means:

```text
More reviews
More work
Less forgetting
```

---

Lower retention:

```text
80%
```

means:

```text
Fewer reviews
More forgetting
```

---

# Mapping to Your Recall Schema

Your schema already has:

```text
ReviewState
├── stability
├── difficulty
├── elapsedDays
├── scheduledFor
├── lastReviewed
├── reps
└── lapses
```

Which maps almost perfectly:

```text
stability      → FSRS Stability
difficulty     → FSRS Difficulty
elapsedDays    → Days since last review
scheduledFor   → Next review date
reps           → Successful reviews
lapses         → Forgot count
```

---

# Recall MVP

```text
User opens Review
↓
Fetch cards due today
↓
Show atom
↓
User chooses:
Again / Hard / Good / Easy
↓
FSRS calculates next date
↓
Update ReviewState
↓
Show next atom
```
