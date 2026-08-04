// Система синхронизации пользовательских данных

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegram?: string;
  telegramUsername?: string;
  status: "open" | "closed";
  avatarUrl?: string;
  language?: string;
}

class UserDataSync {
  private static readonly STORAGE_KEY = "userData_sync";

  // Сохранить все данные пользователя
  static save(userData: UserData): void {
    try {
      // Сохраняем токены перед очисткой
      const token = localStorage.getItem("token");
      const userToken = localStorage.getItem("userToken");

      // Очищаем старые данные перед сохранением
      this.clearOldDuplicates();

      // Основное хранилище
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));

      // Для совместимости со старым кодом
      localStorage.setItem("userData", JSON.stringify(userData));

      // Восстанавливаем токены
      if (token) localStorage.setItem("token", token);
      if (userToken) localStorage.setItem("userToken", userToken);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const token = localStorage.getItem("token");
        const userToken = localStorage.getItem("userToken");

        this.clearOldDuplicates();

        if (token) localStorage.setItem("token", token);
        if (userToken) localStorage.setItem("userToken", userToken);

        try {
          const minimalData = {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            status: userData.status,
            language: userData.language || "ru"
          };
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(minimalData));
        } catch (retryError) {
          try {
            localStorage.clear();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ id: userData.id }));
            if (token) localStorage.setItem("token", token);
            if (userToken) localStorage.setItem("userToken", userToken);
          } catch (finalError) {
            // Storage completely unavailable
          }
        }
      }
    }
  }

  // Очистить старые дубликаты данных
  private static clearOldDuplicates(): void {
    const keysToRemove = [
      "userData_backup",
      "adminStats",
      "adminUsers",
      "adminToken",
      "userData",
      "avatarCache",
      "notifications",
      "messages",
      "tempData"
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    });

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('temp_') ||
          key.startsWith('cache_') ||
          key.startsWith('avatar_') ||
          key.startsWith('notification_') ||
          key.includes('backup')
        )) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // Загрузить данные пользователя
  static load(): UserData | null {
    try {
      // Пробуем основное хранилище
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // Пробуем старое хранилище
      const old = localStorage.getItem("userData");
      if (old) {
        const userData = JSON.parse(old);
        this.save(userData);
        return userData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Объединить данные с приоритетом локальных
  static merge(apiData: UserData, localData: UserData): UserData {
    return {
      ...apiData,
      telegramUsername:
        localData.telegramUsername ||
        localData.telegram ||
        apiData.telegram ||
        apiData.telegramUsername,
      telegram:
        localData.telegram || localData.telegramUsername || apiData.telegram,
      avatarUrl: apiData.avatarUrl || localData.avatarUrl,
      status: localData.status || apiData.status,
      firstName: localData.firstName || apiData.firstName,
      lastName: localData.lastName || apiData.lastName,
      phone: localData.phone || apiData.phone,
      language: localData.language || apiData.language || "ru",
    };
  }

  // Обновить конкретные поля
  static update(updates: Partial<UserData>): UserData | null {
    const current = this.load();
    if (!current) return null;

    const updated = { ...current, ...updates };
    this.save(updated);
    return updated;
  }

  // Очистить все данные
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem("userData_backup");
    localStorage.removeItem("userData");
    localStorage.removeItem("userToken");
    localStorage.removeItem("token");
    localStorage.removeItem("adminStats");
    localStorage.removeItem("adminUsers");
    localStorage.removeItem("adminToken");
  }

  // Принудительная очистка кэша аватаров
  static clearAvatarCache(): void {
    this.clear();
  }
}

export default UserDataSync;
