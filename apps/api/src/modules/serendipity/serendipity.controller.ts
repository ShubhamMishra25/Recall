import { Response } from "express";
import { RequestWithUser } from "../../types/request";
import { redisConnection } from "../../lib/redis";
import { SerendipityService } from "./serendipity.service";

export async function getDailyCardHandler(req: RequestWithUser, res: Response) {
  try {
    const userId = req.userId!;
    
    // 1. Try to get it from the Redis cache first
    const cachedCard = await redisConnection.get(`serendipity-v2:${userId}`);
    
    if (cachedCard) {
      return res.json({ data: JSON.parse(cachedCard) });
    }

    // 2. Fallback: If they are a new user or the cron hasn't run yet, calculate it on the fly!
    const freshCard = await SerendipityService.generateDailyCard(userId);
    
    if (freshCard) {
      await redisConnection.setex(`serendipity-v2:${userId}`, 86400, JSON.stringify(freshCard));
      return res.json({ data: freshCard });
    }

    res.json({ data: null });
  } catch (error) {
    console.error("Serendipity fetch error:", error);
    res.status(500).json({ error: "Failed to fetch daily card" });
  }
}