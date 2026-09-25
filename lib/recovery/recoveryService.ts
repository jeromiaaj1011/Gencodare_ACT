import { InterventionContent, ReTestAssessment } from "../types/index";
import { store } from "../storage/store";

export class RecoveryService {
  /**
   * Retrieves the targeted multi-modal recovery intervention for a root gap concept.
   */
  public static getIntervention(conceptId: string, sessionId?: string): InterventionContent | undefined {
    return store.getIntervention(conceptId, sessionId);
  }

  /**
   * Retrieves the mandatory re-test assessment for a concept.
   */
  public static getReTest(conceptId: string, sessionId?: string): ReTestAssessment | undefined {
    return store.getReTest(conceptId, sessionId);
  }
}
