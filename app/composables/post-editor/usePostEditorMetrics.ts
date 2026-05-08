import { computed } from "vue";

type MetricsForm = {
  title: string;
  content: string;
};

export function usePostEditorMetrics(form: MetricsForm) {
  const titleCount = computed(() => form.title.length);

  const plainTextContent = computed(() =>
    form.content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  const wordCount = computed(() =>
    plainTextContent.value ? plainTextContent.value.split(" ").length : 0,
  );

  const readingTime = computed(() =>
    wordCount.value > 0 ? Math.ceil(wordCount.value / 200) : 0,
  );

  return {
    titleCount,
    plainTextContent,
    wordCount,
    readingTime,
  };
}
