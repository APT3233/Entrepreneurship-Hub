import { Router } from "express";
import { authenticate } from "app/core/middlewares/authMiddleware.js";
import { roleGuard } from "app/core/middlewares/roleGuard.js";
import { validateRequest } from "app/core/middlewares/validateRequest.js";
import {
  bindRubricSchema,
  cloneRubricSchema,
  createCriterionSchema,
  createRubricSchema,
  deleteCriterionSchema,
  evaluationParamsSchema,
  gradingDashboardSchema,
  gradingFormSchema,
  listGradingSubmissionSchema,
  listEvaluationSchema,
  listRubricSchema,
  rubricParamsSchema,
  saveEvaluationSchema,
  updateCriterionSchema,
  updateRubricSchema,
} from "./evaluation.validation.js";

export const createEvaluationRouter = (container) => {
  const { evaluationController } = container.cradle;
  const router = Router();
  const evaluatorRoles = roleGuard("admin", "department_head", "lecturer");

  router.use(authenticate, evaluatorRoles);

  router.get("/rubrics", validateRequest(listRubricSchema), evaluationController.listRubrics);
  router.post("/rubrics", validateRequest(createRubricSchema), evaluationController.createRubric);
  router.post("/rubrics/:id/clone", validateRequest(cloneRubricSchema), evaluationController.cloneRubric);
  router.get("/rubrics/:id", validateRequest(rubricParamsSchema), evaluationController.getRubric);
  router.put("/rubrics/:id", validateRequest(updateRubricSchema), evaluationController.updateRubric);
  router.delete("/rubrics/:id", validateRequest(rubricParamsSchema), evaluationController.deleteRubric);

  router.post("/rubrics/:id/criteria", validateRequest(createCriterionSchema), evaluationController.createCriterion);
  router.put(
    "/rubrics/:id/criteria/:criterionId",
    validateRequest(updateCriterionSchema),
    evaluationController.updateCriterion,
  );
  router.delete(
    "/rubrics/:id/criteria/:criterionId",
    validateRequest(deleteCriterionSchema),
    evaluationController.deleteCriterion,
  );
  router.post("/rubrics/:id/bindings", validateRequest(bindRubricSchema), evaluationController.bindRubric);

  router.get(
    "/grading/dashboard",
    validateRequest(gradingDashboardSchema),
    evaluationController.getGradingDashboard,
  );
  router.get(
    "/grading/submissions",
    validateRequest(listGradingSubmissionSchema),
    evaluationController.listGradingSubmissions,
  );
  router.get(
    "/grading-form/:targetType/:targetId",
    validateRequest(gradingFormSchema),
    evaluationController.getGradingForm,
  );
  router.post("/drafts", validateRequest(saveEvaluationSchema), evaluationController.saveDraft);
  router.post("/submit", validateRequest(saveEvaluationSchema), evaluationController.submitEvaluation);

  router.get("/", validateRequest(listEvaluationSchema), evaluationController.listEvaluations);
  router.get("/:id", validateRequest(evaluationParamsSchema), evaluationController.getEvaluation);

  return router;
};
