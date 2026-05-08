import { reactive } from "vue";
import { describe, expect, it } from "vitest";

import { usePostEditorMetrics } from "../../app/composables/post-editor/usePostEditorMetrics";

describe("usePostEditorMetrics", () => {
  it("derives plain text, word count, reading time, and title count from the form", () => {
    const form = reactive({
      title: "Judul Artikel",
      content: "<p>Hello&nbsp;world</p><p>lagi</p>",
    });

    const metrics = usePostEditorMetrics(form);

    expect(metrics.titleCount.value).toBe(13);
    expect(metrics.plainTextContent.value).toBe("Hello world lagi");
    expect(metrics.wordCount.value).toBe(3);
    expect(metrics.readingTime.value).toBe(1);
  });

  it("handles empty and whitespace-only content safely", () => {
    const form = reactive({
      title: "",
      content: "<p>&nbsp;</p>",
    });

    const metrics = usePostEditorMetrics(form);

    expect(metrics.plainTextContent.value).toBe("");
    expect(metrics.wordCount.value).toBe(0);
    expect(metrics.readingTime.value).toBe(0);
  });
});
