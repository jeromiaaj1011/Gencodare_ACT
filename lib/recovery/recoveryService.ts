import { InterventionContent, ReTestAssessment } from "../types";
import { store } from "../storage/store";

export class RecoveryService {
  /**
   * Retrieves the targeted multi-modal recovery intervention for a root gap concept.
   */
  public static getIntervention(conceptId: string): InterventionContent | undefined {
    return store.getIntervention(conceptId);
  }

  /**
   * Retrieves the mandatory re-test assessment for a concept.
   */
  public static getReTest(conceptId: string): ReTestAssessment | undefined {
    return store.getReTest(conceptId);
  }
}
