import { useEffect, useState } from "react";
import { evaluationLookupService, rubricService } from "@/api/adminEvaluationOps";

export default function useAnalyticsLookups({ includeRubrics = false } = {}) {
  const [lookups, setLookups] = useState({ subjects: [], semesters: [], classes: [], graders: [] });
  const [rubrics, setRubrics] = useState([]);

  useEffect(() => {
    let mounted = true;
    evaluationLookupService.getAll()
      .then((res) => {
        if (mounted) setLookups(res?.data || { subjects: [], semesters: [], classes: [], graders: [] });
      })
      .catch(() => {
        if (mounted) setLookups({ subjects: [], semesters: [], classes: [], graders: [] });
      });

    if (includeRubrics) {
      rubricService.list({ limit: 100 })
        .then((res) => {
          if (mounted) setRubrics(res?.data || []);
        })
        .catch(() => {
          if (mounted) setRubrics([]);
        });
    }

    return () => {
      mounted = false;
    };
  }, [includeRubrics]);

  return { lookups, rubrics };
}
