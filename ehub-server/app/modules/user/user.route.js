import { Router } from "express";

/**
 * User Router
 * Prefix: /api/v1/users
 *
 * GET    /           — list users (admin+)
 * POST   /           — create user (admin+)
 * GET    /:id        — get user by id
 * PATCH  /:id        — update user
 * DELETE /:id        — delete user (admin+)
 */
const router = Router();

// TODO: implement user routes
// router.get('/',     authenticate, authorize('admin'), userController.list)
// router.post('/',    authenticate, authorize('admin'), validateRequest(createUserSchema), userController.create)
// router.get('/:id',  authenticate, userController.getById)
// router.patch('/:id',authenticate, validateRequest(updateUserSchema), userController.update)
// router.delete('/:id',authenticate, authorize('admin'), userController.remove)

export default router;
