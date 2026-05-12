import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/ui/animated-characters-login-page";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
