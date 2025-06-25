import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,
    max:50,
    message:'Too many requests from this IP, please try again later'
})