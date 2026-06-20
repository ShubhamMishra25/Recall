import { Response } from "express";
import { RequestWithUser } from "../../types/request";
import { semanticSearch } from "./search.service";

export async function searchHandler(req: RequestWithUser, res: Response) {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ error: "Missing search query '?q=...'" });
    }

    const results = await semanticSearch(req.userId!, query);
    res.json({ data: results });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to perform semantic search" });
  }
}
