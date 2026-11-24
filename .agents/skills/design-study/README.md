# Maintaining the design-study skill

A designer can arrive with a topic and still be working out the question. The agent contributes design reasoning, builds something the designer can judge, and carries the reasons for each decision into the next round. A successful study can rule an idea out. The designer decides what the evidence settles and when to stop.

## Where an edit belongs

| When changing… | Edit here |
| --- | --- |
| How Studies builds and publishes its pages, including closed MDX records | [Studies](../../../docs/specs/studies/spec.md) |
| How the agent starts, moves between parts, or closes the study | [SKILL.md](SKILL.md) |
| What to build after the designer picks, rejects, or leaves a proposal open | [Exploration](references/exploration.md) |
| How an independent reviewer tests the opening question and reports findings | [Question test](references/question-test.md) |
| How to express a design reason, show the extent of a decision, or preserve a finding at closure | [Annotated writing examples](references/writing.md) |

Keep instrument-specific operating details in the instrument specs. [Lab instruments](../lab-instruments/SKILL.md) owns choosing and composing instruments; this skill owns study decisions and evidence retention.

## Reviewing a proposed lesson

Start with the moment the agent made a consequential choice. What did the designer ask, what did the agent do, and what should it have done with the information available then? Check whether the existing instruction was missing, ambiguous, or simply overlooked. If an instruction was overlooked, improving its placement may do more than adding a second copy.

Try the proposed wording on a nearby case where the right action differs. If the designer rejects an entire silhouette, the next example can explore a different form. If they pick the silhouette and reject its exhaust, the next example should preserve the hull. A rule to “always propose something different after rejection” would lose the designer’s choice. The exploration guide is the place to clarify that distinction.

Treat a study observation as evidence with a scope. Review the interpretation before promoting it to standing guidance. When a study suggests changing the game or a shared Lab tool, the project separately decides whether to adopt the proposal and where it applies. Record that decision in the owning spec before implementation.

For a behavior-changing edit, describe the decision it should change and a case it should preserve in the review. Git history holds the individual incidents. This README is for people and agents editing the skill.
