import { AiProviderError } from "./provider-error.js";

export function createIncidentReplayAdapter({ scenario = "success" } = {}) {
  return {
    name: "replay",
    async generate({ input }) {
      const meta = {
        provider: "replay",
        model: `incident-${scenario}`,
        durationMs: 4
      };

      if (scenario === "timeout") {
        throw new AiProviderError(
          "timeout",
          "Il provider Replay ha simulato il superamento del tempo massimo."
        );
      }

      if (scenario === "refusal") {
        return {
          content: null,
          refusal: "Il provider Replay ha simulato un rifiuto.",
          meta
        };
      }

      if (scenario === "invalid_output") {
        return {
          content: JSON.stringify({
            title: "Output incompleto",
            summary: "Manca il prossimo passo richiesto dal contratto."
          }),
          meta
        };
      }

      const tickets = input.tickets;
      const ids = tickets.map((ticket) => ticket.id);
      const urgent = tickets.filter((ticket) => ticket.priority === "alta");

      return {
        content: JSON.stringify({
          title: "Possibile anomalia condivisa nei ticket selezionati",
          summary: `${tickets.length} ticket richiedono una verifica congiunta prima di confermare un incidente.`,
          evidence: tickets.map((ticket) => ({
            ticketId: ticket.id,
            observation: `${ticket.title} - priorita' ${ticket.priority}`
          })),
          missingInformation: [
            "Timestamp precisi degli eventi",
            "Versione applicativa interessata"
          ],
          suggestedNextAction: `Confrontare log e riproducibilita' per ${ids.join(", ")}.`,
          riskFlags: urgent.length > 0 ? ["availability", "customer_impact"] : ["unknown"]
        }),
        meta
      };
    }
  };
}

