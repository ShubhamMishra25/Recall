import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../types/request";
import { redisConnection } from "../../lib/redis";
import { SerendipityService } from "./serendipity.service";

export async function getDailyCardHandler(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId!;

    const cachedCard = await redisConnection.get(`serendipity-v2:${userId}`);

    if (cachedCard) {
      return res.json({ data: JSON.parse(cachedCard) });
    }

    const freshCard = await SerendipityService.generateDailyCard(userId);

    if (freshCard) {
      await redisConnection.setex(
        `serendipity-v2:${userId}`,
        86400,
        JSON.stringify(freshCard),
      );
      return res.json({ data: freshCard });
    }

    res.json({ data: null });
  } catch (error) {
    next(error);
  }
}
