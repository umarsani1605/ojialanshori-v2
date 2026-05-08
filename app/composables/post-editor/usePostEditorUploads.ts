import type {
  PostEditorForm,
  RichTextEditor,
  ToastApi,
} from "./types";

type MaybeRef<T> = { value: T };

type UsePostEditorUploadsOptions = {
  form: PostEditorForm;
  coverInputKey: MaybeRef<number>;
  coverFile: MaybeRef<File | null>;
  uploadingEditorImage: MaybeRef<boolean>;
  toast: ToastApi;
};

export function usePostEditorUploads(options: UsePostEditorUploadsOptions) {
  async function handleCoverChange(file: File | null | undefined) {
    if (!file) return;

    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Ukuran cover maksimal 2MB.");
      }

      const formData = new FormData();
      formData.append("cover", file);

      const response = await $fetch<{ path: string }>("/api/posts/upload/cover", {
        method: "POST",
        body: formData,
      });

      options.form.featuredImage = response.path;
      options.coverInputKey.value += 1;
      options.coverFile.value = null;
      options.toast.add({
        title: "Cover berhasil diunggah",
        color: "success",
        icon: "i-ph-check",
      });
    } catch (error) {
      options.toast.add({
        title: "Gagal mengunggah cover",
        description: errorMessage(error),
        color: "error",
        icon: "i-ph-warning-circle",
      });
    }
  }

  async function promptEditorImageUpload(editor: RichTextEditor) {
    if (!import.meta.client || options.uploadingEditorImage.value) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;

      try {
        options.uploadingEditorImage.value = true;

        if (file.size > 2 * 1024 * 1024) {
          throw new Error("Ukuran gambar maksimal 2MB.");
        }

        const formData = new FormData();
        formData.append("image", file);

        const response = await $fetch<{ url: string }>(
          "/api/posts/upload/editor-image",
          { method: "POST", body: formData },
        );

        editor
          .chain()
          .focus()
          .setImage({
            src: response.url,
            alt: file.name.replace(/\.[^/.]+$/, ""),
          })
          .run();

        options.toast.add({
          title: "Gambar berhasil diunggah",
          color: "success",
          icon: "i-ph-check",
        });
      } catch (error) {
        options.toast.add({
          title: "Gagal mengunggah gambar",
          description: errorMessage(error),
          color: "error",
          icon: "i-ph-warning-circle",
        });
      } finally {
        options.uploadingEditorImage.value = false;
      }
    };

    input.click();
  }

  return {
    handleCoverChange,
    promptEditorImageUpload,
  };
}

function errorMessage(error: unknown) {
  return (
    (error as { data?: { message?: string } }).data?.message ??
    (error as Error).message ??
    "Terjadi kesalahan."
  );
}
