export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const { $posthog } = useNuxtApp();
  const posthog = $posthog?.();
  if (!posthog) return;

  const shouldRecord =
    to.path.startsWith("/dashboard") || to.path.startsWith("/admin");

  if (shouldRecord) {
    posthog.startSessionRecording();
  } else {
    posthog.stopSessionRecording();
  }
});
