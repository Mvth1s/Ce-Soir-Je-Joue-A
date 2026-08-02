import { ref, watchEffect } from "vue";

export type Theme = "light" | "dark";

const theme = ref<Theme>("light");

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
  const [acc, accInk] =
    theme.value === "dark" ? ["#6FB3E0", "#10222E"] : ["#2F72A6", "#FFF8F3"];
  document.documentElement.style.setProperty("--acc", acc);
  document.documentElement.style.setProperty("--accink", accInk);
});

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggleTheme };
}
