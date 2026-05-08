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
    const wordsPerMinute = 225;
    const noOfWords = plainTextContent.value.split(/\s+/g).length;
    const minutes = Math.ceil(noOfWords / wordsPerMinute);
    return minutes;
  });

  return {
    titleCount,
    plainTextContent,
    wordCount,
    readingTime,
  };
}
