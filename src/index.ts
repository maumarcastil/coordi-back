import Fastify from "fastify";

const server = Fastify({ logger: true });

server.get("/health", () => {
	return { status: "ok" };
});

server
	.listen({ port: 3000, host: "0.0.0.0" })
	.then(() => {
		server.log.info("Server running on http://0.0.0.0:3000");
	})
	.catch((err) => {
		server.log.error(err);
		process.exit(1);
	});
