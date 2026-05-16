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

  const readingTime = computed(() => {
    if (!plainTextContent.value) return 0;
    const wordsPerMinute = 225;
    const avgCharsPerWord = 5;
    const effectiveWords = Math.max(
      wordCount.value,
      Math.ceil(plainTextContent.value.length / avgCharsPerWord),
    );
    return Math.max(1, Math.ceil(effectiveWords / wordsPerMinute));
  });

  return {
    titleCount,
    plainTextContent,
    wordCount,
    readingTime,
  };
}
