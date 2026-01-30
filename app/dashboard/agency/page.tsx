'use client';

import ProtectedRoute from '@/components/protected-route';
import AgencyWorkflowExperience from '@/components/agency-workflow-experience';

export default function AgencyDashboardPage() {
  return (
    <ProtectedRoute>
      <AgencyWorkflowExperience />
    </ProtectedRoute>
  );
}
