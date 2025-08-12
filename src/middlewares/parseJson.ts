import { NextFunction, Request, Response } from "express";

export const parseBodyData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
  
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }


    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        const val = req.body[key].trim();
        if ((val.startsWith("{") && val.endsWith("}")) || (val.startsWith("[") && val.endsWith("]")) || (val.startsWith('"') && val.endsWith('"'))) {
          try {
            req.body[key] = JSON.parse(val);
          } catch {
            
          }
        }
      }
    }

    next();
  } catch (error: any) {
    console.error("Error parsing JSON:", error.message);
    res.status(400).json({
      success: false,
      message: "Invalid JSON format in body data",
    });
  }
};
