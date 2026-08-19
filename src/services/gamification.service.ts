import { prisma } from "@/lib/prisma";

export class GamificationService {
  /**
   * Adds XP to a user and calculates level ups.
   */
  static async addXP(userId: string, amount: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id_user: userId },
        select: { xp: true, level: true },
      });

      if (!user) return null;

      const newXP = user.xp + amount;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

      const updatedUser = await prisma.user.update({
        where: { id_user: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      });

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

      const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Logged in next day, increment streak
        const newCurrent = streak.current_streak + 1;
        return prisma.userStreak.update({
          where: { id_user: userId },
          data: {
            current_streak: newCurrent,
            longest_streak: Math.max(newCurrent, streak.longest_streak),
            last_activity_date: now,
          },
        });
      } else if (diffDays > 1) {
        // Missed a day, reset streak
        return prisma.userStreak.update({
          where: { id_user: userId },
          data: {
            current_streak: 1,
            last_activity_date: now,
          },
        });
      }

      // Logged in the same day, do nothing
      return streak;
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
}
