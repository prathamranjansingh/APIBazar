import express, { Request, Response, NextFunction } from "express"; 
import { findOrCreateUser, findUserByAuth0Id } from "../controllers/auth/authController"; 
import { userRegistrationSchema, userLoginSchema } from "../utils/validators"; 
import { validate } from "../middlewares/validationRequest"; 
 
const router = express.Router(); 
 
// ✅ Signup/Login (Auth0) 
router.post(
  "/login",
  validate(userRegistrationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try { 
      const user = await findOrCreateUser(req.body); 
      res.status(200).json({ user }); 
      return; // ✅ Explicitly return
    } catch (error) { 
      console.error("Login error:", error); 
      next(error);
      return; // ✅ Explicitly return after next(error)
    } 
  }
);


 
router.get(
  "/me", validate(userLoginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
    try { 
      const auth0Id = (req as any).user?.sub; // Extract from Auth0 JWT
      if (!auth0Id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await findUserByAuth0Id(auth0Id); 
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ user }); 
      return; // ✅ Explicitly return
    } catch (error) { 
      console.error("Fetch user error:", error); 
      next(error);
      return; // ✅ Explicitly return after next(error)
    } 
  }
);


 
export default router;