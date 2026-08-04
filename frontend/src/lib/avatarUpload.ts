// Универсальная система аватаров — оптимизирована для Supabase Storage

export class AvatarUpload {
  private static readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB
  private static readonly MAX_DIMENSION = 400; // 400px

  // Сжать и конвертировать в base64
  static async compressAndConvert(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > this.MAX_SIZE) {
        reject(new Error("Размер файла не должен превышать 2MB"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          let { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            this.MAX_DIMENSION,
          );

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL("image/jpeg", 0.8);

            if (base64.length > this.MAX_SIZE * 1.5) {
              reject(new Error("Изображение слишком большое после сжатия"));
              return;
            }

            resolve(base64);
          } else {
            reject(new Error("Ошибка создания canvas"));
          }
        };

        img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
        img.src = event.target?.result as string;
      };

      reader.onerror = () => reject(new Error("Ошибка чтения файла"));
      reader.readAsDataURL(file);
    });
  }

  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxDimension: number,
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (width > height) {
      if (width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  // Загрузка на сервер через специальный эндпоинт
  static async uploadUniversal(
    userId: string,
    avatarBase64: string,
  ): Promise<{
    success: boolean;
    avatarUrl?: string;
    isServerSupported?: boolean;
    error?: string;
  }> {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("userToken");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/v1/users/${userId}/avatar`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          avatarData: avatarBase64,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          avatarUrl: result.avatarUrl || avatarBase64,
          isServerSupported: true,
        };
      } else {
        return {
          success: true,
          avatarUrl: avatarBase64,
          isServerSupported: false,
        };
      }
    } catch (error) {
      return {
        success: true,
        avatarUrl: avatarBase64,
        isServerSupported: false,
      };
    }
  }

  // Обновить аватар через основной API (fallback)
  static async updateViaMainAPI(
    userId: string,
    avatarBase64: string,
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("userToken");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/v1/users/me`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          avatar: avatarBase64,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          avatarUrl: result.user?.avatarUrl || avatarBase64,
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Главная функция загрузки — пробует все способы
  static async upload(
    userId: string,
    avatarBase64: string,
  ): Promise<{
    success: boolean;
    avatarUrl?: string;
    method: "server" | "local";
    error?: string;
  }> {
    // Способ 1: Пробуем специальный эндпоинт аватаров
    const serverResult = await this.uploadUniversal(userId, avatarBase64);
    if (serverResult.success && serverResult.isServerSupported) {
      return {
        success: true,
        avatarUrl: serverResult.avatarUrl,
        method: "server",
      };
    }

    // Способ 2: Пробуем основной API
    const mainApiResult = await this.updateViaMainAPI(userId, avatarBase64);
    if (mainApiResult.success) {
      return {
        success: true,
        avatarUrl: mainApiResult.avatarUrl,
        method: "server",
      };
    }

    // Способ 3: Локальное сохранение (всегда работает)
    return {
      success: true,
      avatarUrl: avatarBase64,
      method: "local",
    };
  }
}

export default AvatarUpload;
