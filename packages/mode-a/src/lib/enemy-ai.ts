import { z } from "zod";

export const EnemyObjectiveSchema = z.enum(["pursue", "recover"]);
export type EnemyObjective = z.infer<typeof EnemyObjectiveSchema>;
export const EnemyCapabilitiesSchema = z
  .object({ solarRecovery: z.boolean() })
  .readonly();
export interface EnemyAIActor {
  objective: EnemyObjective;
  resources: { power: number };
}

/** Capability-neutral objective latch; the encounter supplies capacity/capability. */
export function updateEnemyObjectiveForCapacity(
  actor: EnemyAIActor,
  capacity: number,
  solarRecovery: boolean,
): EnemyObjective {
  if (solarRecovery && capacity > 0) {
    const energy = actor.resources.power / capacity;
    if (actor.objective === "recover" ? energy < 0.8 : energy < 0.2)
      actor.objective = "recover";
    else actor.objective = "pursue";
  } else actor.objective = "pursue";
  return actor.objective;
}

/** A profile supplies feasible actions and predicts their cost. Equal scores keep catalogue order. */
export function chooseEnemyAction<Action, Decision extends { score: number }>(
  actions: readonly Action[],
  evaluate: (action: Action) => Decision,
): Decision {
  if (!actions.length)
    throw new Error("Enemy profiles require at least one available action");
  let best = evaluate(actions[0]);
  for (let index = 1; index < actions.length; index++) {
    const candidate = evaluate(actions[index]);
    if (candidate.score < best.score) best = candidate;
  }
  return best;
}
