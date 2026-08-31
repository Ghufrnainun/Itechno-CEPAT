import { prisma } from "@/lib/prisma";

export class GamificationService {
  /**
   * Adds XP to a user and calculates level ups.
   */
  static async addXP(userId: string, amount: number, source: string = "SYSTEM") {
    try {
      const user = await prisma.user.findUnique({
        where: { id_user: userId },
        select: { xp: true, level: true },
      });

      if (!user) return null;

      const newXP = user.xp + amount;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

      // Update User
      const updatedUser = await prisma.user.update({
        where: { id_user: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });

      // Add to XPLog
      await prisma.xPLog.create({
        data: {
          id_user: userId,
          xp_amount: amount,
          source: source,
        },
      });

      // Auto-Cleanup: Hapus log yang umurnya lebih dari 1 tahun
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      // Fire and forget cleanup
      prisma.xPLog.deleteMany({
        where: {
          created_at: {
            lt: oneYearAgo,
          },
        },
      }).catch((e: unknown) => console.error("[GamificationService] Cleanup error:", e));

      return updatedUser;
    } catch (error) {
      console.error("[GamificationService] Failed to add XP:", error);
      return null;
    }
  }

  /**
   * Updates the user's daily streak.
   */
  static async updateStreak(userId: string) {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const streak = await prisma.userStreak.findUnique({
        where: { id_user: userId },
      });

      if (!streak) {
        return prisma.userStreak.create({
          data: {
            id_user: userId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: now,
          },
        });
      }

      if (!streak.last_activity_date) {
        return prisma.userStreak.update({
          where: { id_user: userId },
          data: {
            current_streak: 1,
            longest_streak: Math.max(1, streak.longest_streak),
            last_activity_date: now,
          },
        });
      }

      const lastActivity = new Date(streak.last_activity_date);
      lastActivity.setHours(0, 0, 0, 0);

      // Compare dates directly using normalized strings (no time component)
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const lastStr = lastActivity.toISOString().split("T")[0];

      if (today === lastStr) {
        // Logged in same day, do nothing
        return streak;
      }

      // Calculate yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastStr === yesterdayStr) {
        // Previous day logged in → increment streak
        const newCurrent = streak.current_streak + 1;
        return prisma.userStreak.update({
          where: { id_user: userId },
          data: {
            current_streak: newCurrent,
            longest_streak: Math.max(newCurrent, streak.longest_streak),
            last_activity_date: now,
          },
        });
      }

      // Gap > 1 day (missed a day) → reset to 1
      return prisma.userStreak.update({
        where: { id_user: userId },
        data: {
          current_streak: 1,
          last_activity_date: now,
        },
      });
    } catch (error) {
      console.error("[GamificationService] Failed to update streak:", error);
      return null;
    }
  }

  /**
   * Evaluates and awards badges for a user.
   */
  static async checkAndAwardBadges(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id_user: userId },
        include: {
          user_badges: true,
          user_streak: true,
        },
      });

      if (!user) return;

      const allBadges = await prisma.badge.findMany();
      const earnedBadgeIds = new Set(user.user_badges.map((b) => b.id_badge));

      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id_badge)) continue;

        let isEligible = false;

        switch (badge.criteria_type) {
          case "task_count":
            isEligible = user.total_completed >= badge.criteria_val;
            break;
          case "rating":
            isEligible = user.rating_avg >= badge.criteria_val;
            break;
          case "streak":
            isEligible = (user.user_streak?.current_streak ?? 0) >= badge.criteria_val;
            break;
          case "earning":
            isEligible = user.total_balance >= badge.criteria_val;
            break;
        }

        if (isEligible) {
          await prisma.userBadge.create({
            data: {
              id_user: userId,
              id_badge: badge.id_badge,
            },
          });
        }
      }
    } catch (error) {
      console.error("[GamificationService] Failed to check badges:", error);
    }
  }

  /**
   * Memberikan bonus XP tambahan berdasarkan streak aktif user.
   * Dipanggil SETELAH updateStreak() — jadi current_streak sudah nilai terbaru.
   *
   * Skala bonus (biar progres level tetap terasa):
   * - streak 3-6 hari   → +10 XP
   * - streak 7-13 hari  → +25 XP
   * - streak 14-29 hari → +50 XP
   * - streak 30+ hari   → +100 XP
   */
  static async awardStreakBonusXP(userId: string) {
    try {
      const streak = await prisma.userStreak.findUnique({
        where: { id_user: userId },
      });

      if (!streak) return null;

      const { current_streak } = streak;
      let bonus = 0;
      if (current_streak >= 30) bonus = 100;
      else if (current_streak >= 14) bonus = 50;
      else if (current_streak >= 7) bonus = 25;
      else if (current_streak >= 3) bonus = 10;

      if (bonus <= 0) return null;

      return this.addXP(userId, bonus);
    } catch (error) {
      console.error("[GamificationService] Failed to award streak bonus XP:", error);
      return null;
    }
  }
}
