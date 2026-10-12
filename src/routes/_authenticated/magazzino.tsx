import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/magazzino")({
  beforeLoad: () => {
    throw redirect({ to: "/catalogo" });
  },
  component: () => null,
});
