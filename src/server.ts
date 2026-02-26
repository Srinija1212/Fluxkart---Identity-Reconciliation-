import "dotenv/config";
import { app } from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
