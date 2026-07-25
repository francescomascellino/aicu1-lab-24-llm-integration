import { createTicketApplication } from "./app.js";

const preferredPort = Number(process.env.PORT || 4173);
const application = createTicketApplication();

listen(preferredPort);

function listen(port) {
  const onError = (error) => {
    application.server.off("listening", onListening);

    if (error.code === "EADDRINUSE" && !process.env.PORT && port < preferredPort + 10) {
      console.warn(`Porta ${port} occupata, provo ${port + 1}.`);
      listen(port + 1);
      return;
    }

    throw error;
  };

  const onListening = () => {
    application.server.off("error", onError);
    console.log(`L24 app pronta su http://127.0.0.1:${port}/incident.html`);
  };

  application.server.once("error", onError);
  application.server.once("listening", onListening);
  application.server.listen(port, "127.0.0.1");
}

async function shutdown() {
  await application.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
