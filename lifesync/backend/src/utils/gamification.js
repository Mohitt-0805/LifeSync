import { User } from "../models/User.js";
import { Activity } from "../models/Activity.js";
import { Notification } from "../models/Notification.js";
import { Achievement } from "../models/Achievement.js";

/**
 * Rewards XP to user, handles leveling calculations, writes activity timeline feeds, 
 * and triggers level-based achievements and alerts.
 */
export const rewardXP = async (userId, xpAmount, action, moduleName, description) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    user.xp += xpAmount;

    // Level-up formula: level * 200 XP required
    let nextLevelXp = user.level * 200;
    let leveledUp = false;

    while (user.xp >= nextLevelXp) {
      user.xp -= nextLevelXp;
      user.level += 1;
      nextLevelXp = user.level * 200;
      leveledUp = true;
    }

    await user.save({ validateBeforeSave: false });

    // Log user activity
    const activity = await Activity.create({
      user: userId,
      action,
      module: moduleName,
      description,
      xpEarned: xpAmount,
    });

    if (leveledUp) {
      // Dispatch alert
      await Notification.create({
        user: userId,
        title: "🎉 Level Up!",
        message: `Congratulations! You leveled up to Level ${user.level}!`,
        type: "system",
      });

      // Award Level achievements
      if (user.level === 2) {
        await checkAndUnlockAchievement(userId, "lvl_2", "Rising Star", "Earned Level 2 status!", "Award");
      } else if (user.level === 5) {
        await checkAndUnlockAchievement(userId, "lvl_5", "Productivity Ninja", "Earned Level 5 status!", "Zap");
      }
    }

    return { user, activity, leveledUp };
  } catch (error) {
    console.error("Error rewarding XP: ", error);
    return null;
  }
};

/**
 * Reverts XP when user undoes an action (e.g. unchecking a completed task).
 */
export const deductXP = async (userId, xpAmount, action, moduleName, description) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    user.xp -= xpAmount;
    if (user.xp < 0) {
      if (user.level > 1) {
        user.level -= 1;
        user.xp = (user.level * 200) + user.xp;
      } else {
        user.xp = 0;
      }
    }

    await user.save({ validateBeforeSave: false });

    // Log reversal timeline event
    await Activity.create({
      user: userId,
      action: `${action}_undone`,
      module: moduleName,
      description: `${description} (XP Reversed)`,
      xpEarned: -xpAmount,
    });

    return user;
  } catch (error) {
    console.error("Error deducting XP: ", error);
    return null;
  }
};

/**
 * Checks and unlocks achievement tags.
 */
export const checkAndUnlockAchievement = async (userId, badgeCode, title, description, icon) => {
  try {
    const existing = await Achievement.findOne({ user: userId, badgeCode });
    if (existing) return null;

    const achievement = await Achievement.create({
      user: userId,
      badgeCode,
      title,
      description,
      icon,
    });

    await Notification.create({
      user: userId,
      title: `🏆 Achievement Unlocked: ${title}`,
      message: description,
      type: "achievement",
    });

    return achievement;
  } catch (error) {
    console.error("Error checking achievement: ", error);
    return null;
  }
};
